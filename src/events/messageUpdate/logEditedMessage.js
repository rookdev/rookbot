// @ts-nocheck

// Formatters: inlineCode, italic, userMention
const { inlineCode, italic, userMention } = require('discord.js')
// Rook-branded Client
const { RookClient } = require('../../classes/objects/rclient.class')
// Rook-branded Embed
const { RookEmbed } = require('../../classes/embed/rembed.class')
// Use Discord HammerTime
const timeFormat = require('../../utils/timeFormat')
const path = require('path')  // Easier filepath management
const fs = require('fs')      // Filesystem manipulation

/**
 * Logs edited messages from the server.
 * @param {RookClient} client
 * @param {Message} oldMessage
 * @param {Message} newMessage
 */
module.exports = async (client, oldMessage, newMessage) => {
  let result = false
  let messages = []

  try {
    // Check for invalid or undefined data
    if (!newMessage) {
      messages.push(`${client.profile.emojis.fail} MessageUpdate event received invalid data:`, { oldMessage, newMessage })
      return [result, messages]
    }

    // Ensure the message is in a guild and not from a bot
    if (!newMessage.guild) {
      messages.push(`${client.profile.emojis.fail} MessageUpdate occurred outside of a guild:`, newMessage)
      return [result, messages]
    }
    if (newMessage.author?.bot) {
      // messages.push(`${client.profile.emojis.warning} Message update from bot:`, newMessage)
      return [result, messages]
    }

    // Fetch full messages if necessary
    if (oldMessage.partial) {
      try {
        oldMessage = await oldMessage.fetch()
      } catch (err) {
        messages.push(`${client.profile.emojis.fail} Failed to fetch old message:`, err)
        return [result, messages]
      }
    }

    if (newMessage.partial) {
      try {
        newMessage = await newMessage.fetch()
      } catch (err) {
        console.error(`${client.profile.emojis.fail} Failed to fetch new message:`, err)
        return [result, messages]
      }
    }

    // Handle cases where the old or new content is unavailable
    const oldContent = oldMessage.content ?? italic('(Content unavailable)')
    const newContent = newMessage.content ?? italic('(Content unavailable)')

    // Skip if the content hasn't changed
    if (oldContent === newContent) {
      // console.warn('  No content change detected.')
      return [result, messages]
    }

    // Fetch the log channel using its ID
    const guildID = newMessage.guild?.id
    const guildChannelsPath = path.join(
      __dirname,
      "..",
      "..",
      "dbs",
      guildID,
      "channels"
    )
    if (!fs.existsSync(guildChannelsPath + ".json")) {
      messages.push(`${client.profile.emojis.fail} Failed to fetch Guild Channels for '${newMessage.guild.name}' [${newMessage.guild.id}]`)
      return [result, messages]
    }

    const guildChannels = require(guildChannelsPath)
    let log_type = "logging"
    let log_check = "logging-messages"
    if (log_check in guildChannels) {
      log_type = log_check
    }
    let logChannel = null
    try {
      logChannel = await client.channels.fetch(guildChannels[log_type])
    } catch (error) {
      messages.push(`${client.profile.emojis.fail} Log channel not found.`)
      return [result, messages]
    }

    let editor = newMessage.author
    let editMember = await newMessage.guild.members.fetch(editor.id)
    if (editMember) {
      editor = editMember
    }

    let player = {
      name: editor.displayName,
      avatar: editor.displayAvatarURL( { size: Math.pow(2, 7) } )
    }

    const embed = new RookEmbed(client, {
      color: client.profile.colors.info,
      title: {
        text: '[Log] Message Edited',
        emoji: "✏️"
      },
      players: {
        user: player,
        target: player
      },
      fields: [
        [
          // Edited DateTime
          {
            name: 'Edited At',
            value: timeFormat(new Date().getTime())
          }
        ],
        [
          // Who wrote it?
          {
            name: 'Author',
            value: userMention(newMessage.author.id) + " " +
              `[${inlineCode(newMessage.author.id)}]`
          }
        ],
        [
          // Guild Info
          {
            name: 'Guild',
            value: [
              newMessage.guild.name,
              `[${inlineCode(newMessage.guild.id)}]`
            ]
          },
          // Channel Link
          {
            name: 'Channel',
            value: [
              `<#${newMessage.channel.id}>`,
              `[${inlineCode(newMessage.channel.id)}]`
            ]
          }
        ],
        [
          // Message Link
          {
            name: 'Message',
            value: newMessage.url + " " +
              `[${inlineCode(newMessage.id)}]`
          }
        ],
        [
          // Old Content
          {
            name: 'Old Content',
            value: oldContent.slice(0,1024) ?? italic('No old content') // Ensure there's always a default value
          }
        ],
        [
          // New Content
          {
            name: 'New Content',
            value: newContent.slice(0,1024) ?? italic('No new content') // Ensure there's always a default value
          }
        ]
      ]
    })

    let console_log = {
      guild: newMessage.guild.name,
      member: newMessage.author.tag,
      action: "edit",
      channel: newMessage.channel.name,
      message: newMessage.id
    }
    messages.push(JSON.stringify(console_log))

    // Send the embed to the log channel, if found and valid
    if (logChannel) {
      // @ts-ignore
      result = await logChannel.send({ embeds: [embed] })
    } else {
      messages.push(`${client.profile.emojis.fail} Log channel not found.`)
      return [result, messages]
    }

    // Save the edited message to a log file
    const DEV = !process.env.ENV_ACTIVE.startsWith("prod")
    const logFilePath = path.join(
      __dirname,
      '..',
      '..',
      'botlogs',
      `${DEV ? 'DEV' : ''}editedMessages.log`
    )
    const logEntry = [
      `[${new Date().toISOString()}]`,
      `Author:      ${newMessage.author.tag} (ID: ${newMessage.author.id})`,
      `Guild:       ${newMessage.guild?.name} (ID: ${newMessage.guild?.id})`,
      // @ts-ignore
      `Channel:     #${newMessage.channel.name}`,
      `Message ID:  ${newMessage.id}`,
      `Event:       Message Edited`,
      `Old Content: ${oldContent}`,
      `New Content: ${newContent}`,
      '--------------------------------'
    ].join('\n') + '\n\n'

    // Append the log entry to the file
    fs.appendFileSync(logFilePath, logEntry, 'utf8')
  } catch (error) {
    messages.push(`${client.profile.emojis.fail} Error in logEditedMessage handler:`, error)
    return [result, messages]
  }

  return [result, messages]
}
