// @ts-nocheck

const { AuditLogEvent, GuildMember } = require('discord.js')
const { RookClient } = require('../../classes/objects/rclient.class')
const { RookEmbed } = require('../../classes/embed/rembed.class')
const timeFormat = require('../../utils/timeFormat')
const colors = require('../../dbs/colors.json')
const path = require('path')
const fs = require('fs')

/**
 * Logs changes to a user's nickname in the server.
 * @param {RookClient} client
 * @param {GuildMember} oldMember
 * @param {GuildMember} newMember
 */
module.exports = async (client, oldMember, newMember) => {
  try {
    // Check if the nickname has changed
    if (oldMember.nickname === newMember.nickname) {
      console.warn('  No nickname change detected.')
      return false
    }

    // Ensure the member is in a guild
    if (!newMember.guild) {
      console.warn('  GuildMemberUpdate occurred outside of a guild:', newMember)
      return false
    }

    // Fetch a couple audit logs than just one as new entries could've been added right after this event was emitted.
    const fetchedLogs = await newMember.guild?.fetchAuditLogs({
      limit: 6,
      type: AuditLogEvent.MemberUpdate
    }).catch(console.error)

    if (fetchedLogs) {
      // console.log("Logs Fetched!")
    }

    const auditEntry = await fetchedLogs?.entries.find(
      a =>
        // Small filter function to make use of the little discord provides to narrow down the correct audit entry.
        a.target.id === newMember.id &&
        // Ignore entries that are older than 20 seconds to reduce false positives.
        Date.now() - a.createdTimestamp < (20 * 1000)
    )

    let auditDateTime = new Date()
    if (auditEntry) {
      // console.log("Log Entry Found!")
      if (auditEntry?.createdTimestamp) {
        auditDateTime = new Date(auditEntry.createdTimestamp)
      }
    } else {
      // console.log(fetchedLogs)
    }

    // If entry exists, grab the user that updated the guild member and display username + tag, if none, display 'Unknown'.
    let updater = auditEntry?.executor || null
    if (updater) {
      let updaterMember = await newMember.guild.members.fetch(updater.id)
      if (updaterMember) {
        updater = updaterMember
      }
    }

    // Prepare the log embed
    let oldNick = oldMember.nickname ?? "No nickname"
    let newNick = newMember.nickname ?? newMember.user.displayName

    let fields = []
    let players = {
      target: {
        name: newMember.displayName,
        avatar: newMember.displayAvatarURL({ size: 128 })
      }
    }
    if (auditDateTime) {
      fields.push(
        [
          // Edited DateTime
          {
            name: 'Edited At',
            value: auditDateTime
              ? timeFormat(auditDateTime.getTime())
              : 'Unknown'
          }
        ]
      )
    }
    fields.push(
      [
        // User being Edited
        {
          name: 'User',
          value: `<@${newMember.user.id}>` + " " +
            `(ID: \`${newMember.user.id}\`)`
        }
      ]
    )
    if (updater && updater?.id) {
      players.user = {
        name: updater.displayName,
        avatar: updater.displayAvatarURL({ size: 128 })
      }
      fields.push(
        // Updated by someone we can capture
        [
          {
            name: 'Updater',
            value: `<@${updater.id}>` + " " +
              `(ID: \`${updater.id}\`)`
          }
        ]
      )
    } else {
      let clientMember = await newMember.guild.members.fetch(client.user.id)
      if (clientMember) {
        players.user = {
          name: clientMember.displayName,
          avatar: clientMember.displayAvatarURL({ size: 128 })
        }
      }
      fields.push(
        // Updated by someone we can't capture
        // Usually either self or a bot
        [
          {
            name: 'Updater',
            value: `Probably self or a bot`
          }
        ]
      )
    }
    fields.push(
      [
        // What Guild did this happen in?
        {
          name: 'Guild',
          value: [
            newMember.guild.name,
            `(ID: \`${newMember.guild.id}\`)`
          ]
        }
      ],
      [
        // Old Nickname
        {
          name: 'Old Nickname',
          value: oldNick
        }
      ],
      [
        // New Nickname
        {
          name: 'New Nickname',
          value: newNick // Use username if nickname is undefined
        }
      ]
    )

    const embed = new RookEmbed(client, {
      color: colors["info"], // Gold color for nickname changes
      title: {
        text: '[Log] Nickname Changed',
        emoji: "✏️"
      },
      players: players,
      fields: fields
    })

    // Fetch the log channel using its ID
    const guildID = newMember.guild.id
    const guildChannels = require(`../../dbs/${guildID}/channels.json`)
    let log_type = "logging"
    let log_check = "logging-names"
    if (log_check in guildChannels) {
      log_type = log_check
    }
    const logChannel = await client.channels.fetch(guildChannels[log_type])

    // Send the embed to the log channel, if found and valid
    if (logChannel) {
      // @ts-ignore
      await logChannel.send({ embeds: [ embed.toJSON() ] })
    } else {
      console.warn('Log channel not found.')
    }

    // Optional: Save the nickname change to a log file
    const DEV = process.env.ENV_ACTIVE === "development"
    const logFilePath = path.join(
      __dirname,
      '..',
      '..',
      'botlogs',
      `${DEV ? 'DEV' : ''}nicknameChanges.log`
    )
    const logEntry = [
      `[${new Date().toISOString()}]`,
      `User:         ${newMember.user.tag} (ID: ${newMember.user.id})`,
      `Guild:        ${newMember.guild.name} (ID: ${newMember.guild.id})`,
      `Event:        Nickname Changed`,
      `Old Nickname: ${oldNick}`,
      `New Nickname: ${newNick}`, // Use username if nickname is undefined
      '--------------------------------'
    ].join('\n') + '\n\n'

    // Append the log entry to the file
    fs.appendFileSync(logFilePath, logEntry, 'utf8')
  } catch (error) {
    console.error('Error in logNameChange handler:', error)
  }
}
