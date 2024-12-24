// @ts-nocheck

const { AuditLogEvent, Message } = require('discord.js')
const { RookClient } = require('../../classes/objects/rclient.class')
const { RookEmbed } = require('../../classes/embed/rembed.class')
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
    const logChannel = client.channels.cache.get(guildChannels[log_type])

    if (!logChannel || !logChannel.isTextBased()) {
      console.warn('Log channel not found or is not text-based.')
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
    const deleter = await auditEntry?.executor || null

    let fields = []
    fields.push(
      [
        {
          name: 'Author',
          value: `<@${deletedMessage.author.id}>` + " " +
            `(ID: \`${deletedMessage.author.id}\`)`
        }
      ]
    )
    if (deleter && deleter?.id) {
      fields.push(
        [
          {
            name: 'Deleter',
            value: `<@${deleter.id}>` + " " +
              `(ID: \`${deleter.id}\`)`
          }
        ]
      )
    } else {
      fields.push(
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
        {
          name: 'Message',
          value: `${deletedMessage.url} (ID: \`${deletedMessage.id}\`)`
        }
      ],
      [
        {
          name: 'Channel',
          value: `<#${deletedMessage.channel.id}>`
        }
      ],
      [
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
      players: {
        user: {
          name: deletedMessage.author.displayName,
          avatar: deletedMessage.author.displayAvatarURL( { size: 128 } )
        },
        target: {
          name: deletedMessage.author.displayName,
          avatar: deletedMessage.author.displayAvatarURL( { size: 128 } )
        }
      },
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
      `Content:    ${deletedMessage.content}`,
      `Message ID: ${deletedMessage.id}`,
      '--------------------------------'
    )
    // Append the log entry to the file
    fs.appendFileSync(logFilePath, logEntry.join("\n") + "\n", 'utf8')
  } catch (error) {
    console.error('Error logging deleted message:', error)
  }
}
