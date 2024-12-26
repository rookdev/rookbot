// @ts-nocheck

const { AuditLogEvent, Message } = require('discord.js')
const { RookClient } = require('../../classes/objects/rclient.class')
const { RookEmbed } = require('../../classes/embed/rembed.class')
const timeFormat = require('../../utils/timeFormat')
const colors = require('../../dbs/colors.json')
const path = require('path')
const fs = require('fs')

/**
 * Logs deleted messages from the server.
 * @param {RookClient} client
 * @param {Message} deletedMessage
 */
module.exports = async (client, deletedMessage) => {
  try {
    // If the message is partial, fetch the full message (if possible)
    if (deletedMessage.partial) {
      deletedMessage = await deletedMessage.fetch()
    }

    // Skip logging system messages or messages with no content
    if (deletedMessage.system || !deletedMessage.content) {
      return
    }

    // Fetch the log channel using the deletedMessage's guild ID
    const guildID = deletedMessage.guild?.id || 0
    const guildChannels = require(`../../dbs/${guildID}/channels.json`)
    let log_type = "logging"
    let log_check = "logging-messages"
    if (log_check in guildChannels) {
      log_type = log_check
    }
    const logChannel = await client.channels.fetch(guildChannels[log_type])

    if (!logChannel) {
      console.warn('Log channel not found.')
      return
    }

    // Fetch a couple audit logs than just one as new entries could've been added right after this event was emitted.
    const fetchedLogs = await deletedMessage.guild?.fetchAuditLogs({
      limit: 6,
      type: AuditLogEvent.MessageDelete
    }).catch(console.error)

    if (fetchedLogs) {
      // console.log("Logs Fetched!")
    }

    const auditEntry = await fetchedLogs?.entries.find(
      a =>
        // Small filter function to make use of the little discord provides to narrow down the correct audit entry.
        a.target.id === deletedMessage.author.id &&
        a.extra.channel.id === deletedMessage.channel.id &&
        // Ignore entries that are older than 20 seconds to reduce false positives.
        Date.now() - a.createdTimestamp < 20000
    )

    if (auditEntry) {
      // console.log("Log Entry Found!")
    } else {
      // console.log(fetchedLogs)
    }

    // If entry exists, grab the user that deleted the message and display username + tag, if none, display 'Unknown'.
    let deleter = auditEntry?.executor || null
    if (deleter) {
      let deleterMember = await deletedMessage.guild.members.fetch(deleter.id)
      if (deleterMember) {
        deleter = deleterMember
      }
    }
    let deletedAuthor = deletedMessage.author
    let deletedMember = await deletedMessage.guild.members.fetch(deletedAuthor.id)
    if (deletedMember) {
      deletedAuthor = deletedMember
    }

    let fields = []
    let players = {
      target: {
        name: deletedAuthor.displayName,
        avatar: deletedAuthor.displayAvatarURL({ size: 128 })
      }
    }

    let auditDateTime = new Date()
    if (auditEntry?.createdTimestamp) {
      auditDateTime = new Date(auditEntry.createdTimestamp)
    }
    if (auditDateTime) {
      fields.push(
        [
          // Deleted DateTime
          {
            name: 'Deleted At',
            value: auditDateTime
              ? timeFormat(auditDateTime.getTime())
              : 'Unknown'
          }
        ]
      )
    }

    fields.push(
      [
        // Who wrote this?
        {
          name: 'Author',
          value: `<@${deletedMessage.author.id}>` + " " +
            `(ID: \`${deletedMessage.author.id}\`)`
        }
      ]
    )
    if (deleter && deleter?.id) {
      players.user = {
        name: deleter.displayName,
        avatar: deleter.displayAvatarURL({ size: 128 })
      }
      fields.push(
        // Deleted by someone we can capture
        [
          {
            name: 'Deleter',
            value: `<@${deleter.id}>` + " " +
              `(ID: \`${deleter.id}\`)`
          }
        ]
      )
    } else {
      let clientMember = await deletedMessage.guild.members.fetch(client.user.id)
      if (clientMember) {
        players.user = {
          name: clientMember.displayName,
          avatar: clientMember.displayAvatarURL({ size: 128 })
        }
      }
      fields.push(
        // Deleted by someone we can't capture
        // Usually either self or a bot
        [
          {
            name: 'Deleter',
            value: `Probably self or a bot`
          }
        ]
      )
    }
    fields.push(
      [
        // Guild Info
        {
          name: 'Guild',
          value: [
            deletedMessage.guild.name,
            `(ID: \`${deletedMessage.guild.id}\`)`
          ]
        },
        // Channel Link
        {
          name: 'Channel',
          value: [
            `<#${deletedMessage.channel.id}>`,
            `(ID: \`${deletedMessage.channel.id}\`)`
          ]
        }
      ],
      [
        // Message Link
        {
          name: 'Message',
          value: deletedMessage.url +
            `(ID: \`${deletedMessage.id}\`)`
        }
      ],
      [
        // Message Content
        {
          name: 'Content',
          value: deletedMessage.content.slice(0,1024) || '*No content*'
        }
      ]
    )

    // Prepare the log embed
    const logEmbed = new RookEmbed(client, {
      color: colors["bad"], // Orange for message updates
      title: {
        text: '[Log] Message Deleted',
        emoji: "🚮"
      },
      players: players,
      fields: fields
    })


    // Send the log embed to the log channel
    // @ts-ignore
    await logChannel.send({ embeds: [logEmbed] })

    // Optional: Save the deleted message to a log file
    const DEV = process.env.ENV_ACTIVE === "development"
    const logFilePath = path.join(
      __dirname,
      '..',
      '..',
      'botlogs',
      `${DEV ? 'DEV' : ''}deletedMessages.log`
    )
    let logEntry = [
      `[${new Date().toISOString()}]`,
      `Author:     ${deletedMessage.author.tag} (ID: ${deletedMessage.author.id})`
    ]
    if (deleter) {
      logEntry.push(
        `Deleter:    ${deleter.tag} (ID: ${deleter.id})`
      )
    } else {
      logEntry.push(
        `Deleter:    Self/bot?`
      )
    }
    logEntry.push(
      `Guild:      ${deletedMessage.guild?.name} (ID: ${deletedMessage.guild?.id})`,
      // @ts-ignore
      `Channel:    #${deletedMessage.channel.name} (ID: ${deletedMessage.channel.id})`,
      `Message ID: ${deletedMessage.id}`,
      `Event:      Message Deleted`,
      `Content:    ${deletedMessage.content}`,
      '--------------------------------'
    )
    // Append the log entry to the file
    fs.appendFileSync(logFilePath, logEntry.join("\n") + "\n", 'utf8')
  } catch (error) {
    console.error('Error logging deleted message:', error)
  }
}
