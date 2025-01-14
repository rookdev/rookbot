// @ts-nocheck

// Audit Log Events, Guild Member, Formatters: inlineCode, userMention
const { AuditLogEvent, GuildMember, inlineCode, userMention } = require('discord.js')
// Rook-branded Client
const { RookClient } = require('../../classes/objects/rclient.class')
// Rook-branded Embed
const { RookEmbed } = require('../../classes/embed/rembed.class')
// Use Discord HammerTime
const timeFormat = require('../../utils/formatters/timeFormat')
const fileFuncs = require('../../utils/fs/fileFuncs')
const fs = require('fs')      // Filesystem manipulation

/**
 * Logs changes to a user's nickname in the server.
 * @param {RookClient} client
 * @param {GuildMember} oldMember
 * @param {GuildMember} newMember
 */
module.exports = async (client, oldMember, newMember) => {
  let result = false
  let messages = []

  try {
    // Check if the nickname has changed
    if (oldMember.nickname === newMember.nickname) {
      // messages.push(`${client.profile.emojis.warning} No nickname change detected.`)
      return [result, messages]
    }

    // Ensure the member is in a guild
    if (!newMember.guild) {
      messages.push(`${client.profile.emojis.fail} GuildMemberUpdate occurred outside of a guild:`, newMember)
      return [result, messages]
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
    let updater = auditEntry?.executor ?? null
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
        avatar: newMember.displayAvatarURL({ size: Math.pow(2, 7) })
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
          value: userMention(newMember.user.id) + " " +
            `[${inlineCode(newMember.user.id)}]`
        }
      ]
    )
    if (updater && updater?.id) {
      players.user = {
        name: updater.displayName,
        avatar: updater.displayAvatarURL({ size: Math.pow(2, 7) })
      }
      fields.push(
        // Updated by someone we can capture
        [
          {
            name: 'Updater',
            value: userMention(updater.id) + " " +
              `[${inlineCode(updater.id)}]`
          }
        ]
      )
    } else {
      let clientMember = newMember.guild.members.me
      if (clientMember) {
        players.user = {
          name: clientMember.displayName,
          avatar: clientMember.displayAvatarURL({ size: Math.pow(2, 7) })
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
            `[${inlineCode(newMember.guild.id)}]`
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
      color: client.profile.colors.info,
      title: {
        text: '[Log] Nickname Changed',
        emoji: "✏️"
      },
      players: players,
      fields: fields
    })

    let console_log = {
      guild: newMember.guild.name,
      member: newMember.user.tag,
      action: "edit",
      oldName: oldNick,
      newName: newNick
    }
    messages.push("✏️ " + JSON.stringify(console_log))

    // Fetch the log channel using its ID
    const guildID = newMember.guild.id
    const guildChannels = fileFuncs.getAFile(
      [
        "src",
        "dbs",
        guildID
      ],
      "channels.json"
    )
    if (!guildChannels) {
      messages.push(`${client.profile.emojis.fail} Failed to fetch Guild Channels for '${newMember.guild.name}' [${newMember.guild.id}]`)
      return [result, messages]
    }

    let log_type = "logging"
    let log_check = "logging-names"
    if (log_check in guildChannels) {
      log_type = log_check
    }
    const logChannel = await client.channels.fetch(guildChannels[log_type])

    // Send the embed to the log channel, if found and valid
    if (logChannel) {
      // @ts-ignore
      result = await logChannel.send({ embeds: [ embed.toJSON() ] })
    } else {
      messages.push(`${client.profile.emojis.fail} Log channel not found.`)
    }

    // Optional: Save the nickname change to a log file
    const DEV = !process.env.ENV_ACTIVE.startsWith("prod")
    const logFilePath = fileFuncs.getAPath(
      [
        "src",
        "botlogs"
      ],
      `${this.DEV ? 'DEV' : ''}nicknameChanges.log`
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
    messages.push(`${client.profile.emojis.fail} Error in logNameChange handler:`, error)
    return [result, messages]
  }

  return [result, messages]
}
