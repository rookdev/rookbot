// @ts-nocheck

// Audit Log Event, Message, Formatters: inlineCode, italic, userMention
const { AuditLogEvent, Message, inlineCode, italic, userMention } = require('discord.js')
// Rook-branded Client
const { RookClient } = require('../../classes/objects/rclient.class')
// Rook-branded Embed
const { RookEmbed } = require('../../classes/embed/rembed.class')
// Use Discord HammerTime
const timeFormat = require('../../utils/timeFormat')
const path = require('path')  // Easier filepath management
const fs = require('fs')      // Filesystem manipulation

/**
 * Logs deleted messages from the server.
 * @param {RookClient} client
 * @param {Message} deletedMessage
 */
module.exports = async (client, deletedMessage) => {
  let result = false
  let messages = []

  // If the message is partial, fetch the full message (if possible)
  if (deletedMessage.partial) {
    try {
      deletedMessage = await deletedMessage.fetch()
    } catch (error) {
      messages.push(error)
    }
  }

  // Skip logging system messages or messages with no content
  if (deletedMessage.system || !deletedMessage.content) {
    return [result, messages]
  }

  // Fetch the log channel using the deletedMessage's guild ID
  const guildID = deletedMessage.guild?.id ?? 0
  const guildChannelsPath = path.join(
    __dirname,
    "..",
    "..",
    "dbs",
    guildID,
    "channels"
  )
  if (!fs.existsSync(guildChannelsPath + ".json")) {
    messages.push(`Failed to fetch Guild Channels for '${deletedMessage.guild.name}' [${deletedMessage.guild.id}]`)
    return [result, messages]
  }

  const guildChannels = require(guildChannelsPath)
  let log_type = "logging"
  let log_check = "logging-messages"
  if (log_check in guildChannels) {
    log_type = log_check
  }
  const logChannel = await client.channels.fetch(guildChannels[log_type])

  if (!logChannel) {
    messages.push('Log channel not found.')
    return [result, messages]
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
      Date.now() - a.createdTimestamp < 20 * 1000
  )

  if (auditEntry) {
    // console.log("Log Entry Found!")
  } else {
    // console.log(fetchedLogs)
  }

  // If entry exists, grab the user that deleted the message and display username + tag, if none, display 'Unknown'.
  let deleter = auditEntry?.executor ?? null
  if (deleter) {
    let deleterMember = await deletedMessage.guild.members.fetch(deleter.id)
    if (deleterMember) {
      deleter = deleterMember
    }
  }

  // Get Author of message
  let deletedAuthor = deletedMessage.author

  // Get Author Member of message
  let deletedMember = null
  try {
    // This fails if the member has left
    deletedMember = await deletedMessage.guild.members.fetch(deletedAuthor.id)
  } catch (error) {
    // do nothing
  }

  // If we've got an Author Member, use it instead
  if (deletedMember) {
    deletedAuthor = deletedMember
  }

  let fields = []
  let players = {
    target: {
      name: deletedAuthor.displayName,
      avatar: deletedAuthor.displayAvatarURL({ size: Math.pow(2, 7) })
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
        value: userMention(deletedMessage.author.id) + " " +
          `[${inlineCode(deletedMessage.author.id)}]`
      }
    ]
  )
  if (deleter && deleter?.id) {
    players.user = {
      name: deleter.displayName,
      avatar: deleter.displayAvatarURL({ size: Math.pow(2, 7) })
    }
    fields.push(
      // Deleted by someone we can capture
      [
        {
          name: 'Deleter',
          value: userMention(deleter.id) + " " +
            `[${inlineCode(deleter.id)}]`
        }
      ]
    )
  } else {
    let clientMember = deletedMessage.guild.members.me
    if (clientMember) {
      players.user = {
        name: clientMember.displayName,
        avatar: clientMember.displayAvatarURL({ size: Math.pow(2, 7) })
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
          `[${inlineCode(deletedMessage.guild.id)}]`
        ]
      },
      // Channel Link
      {
        name: 'Channel',
        value: [
          `<#${deletedMessage.channel.id}>`,
          `[${inlineCode(deletedMessage.channel.id)}]`
        ]
      }
    ],
    [
      // Message Link
      {
        name: 'Message',
        value: deletedMessage.url + " " +
          `[${inlineCode(deletedMessage.id)}]`
      }
    ],
    [
      // Message Content
      {
        name: 'Content',
        value: deletedMessage.content.slice(0,1024) ?? italic('No content')
      }
    ]
  )

  // Prepare the log embed
  const logEmbed = new RookEmbed(client, {
    color: client.profile.colors.bad,
    title: {
      text: '[Log] Message Deleted',
      emoji: "🚮"
    },
    players: players,
    fields: fields
  })

  let console_log = {
    guild: deletedMessage.guild.name,
    member: deletedMessage.author.tag,
    action: "delete",
    channel: deletedMessage.channel.name,
    message: deletedMessage.id
  }
  messages.push(JSON.stringify(console_log))

  // Send the log embed to the log channel
  // @ts-ignore
  result = await logChannel.send({ embeds: [logEmbed] })

  // Optional: Save the deleted message to a log file
  const DEV = !process.env.ENV_ACTIVE.startsWith("prod")
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

  return [result, messages]
}
