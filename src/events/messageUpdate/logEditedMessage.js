// @ts-nocheck

const { RookClient } = require('../../classes/objects/rclient.class')
const { RookEmbed } = require('../../classes/embed/rembed.class')
const { Message } = require('discord.js')
const colors = require('../../dbs/colors.json')
const path = require('path')
const fs = require('fs')
const timeFormat = require('../../utils/timeFormat')

/**
 * Logs edited messages from the server.
 * @param {RookClient} client
 * @param {Message} oldMessage
 * @param {Message} newMessage
 */
module.exports = async (client, oldMessage, newMessage) => {
  try {
    // Check for invalid or undefined data
    if (!newMessage) {
      console.warn('  MessageUpdate event received invalid data:', { oldMessage, newMessage })
      return
    }

    // Ensure the message is in a guild and not from a bot
    if (!newMessage.guild) {
      console.warn('  MessageUpdate occurred outside of a guild:', newMessage)
      return
    }
    if (newMessage.author?.bot) {
      // console.warn(`Message update from bot:`, newMessage)
      return
    }

    // Fetch full messages if necessary
    if (oldMessage.partial) {
      try {
        oldMessage = await oldMessage.fetch()
      } catch (err) {
        console.error('  Failed to fetch old message:', err)
        return
      }
    }

    if (newMessage.partial) {
      try {
        newMessage = await newMessage.fetch()
      } catch (err) {
        console.error('  Failed to fetch new message:', err)
        return
      }
    }

    // Handle cases where the old or new content is unavailable
    const oldContent = oldMessage.content ?? '*(Content unavailable)*'
    const newContent = newMessage.content ?? '*(Content unavailable)*'

    // Skip if the content hasn't changed
    if (oldContent === newContent) {
      // console.warn('  No content change detected.')
      return
    }

    // Fetch the log channel using its ID
    const guildID = newMessage.guild?.id
    const guildChannels = require(`../../dbs/${guildID}/channels.json`)
    let log_type = "logging"
    let log_check = "logging-messages"
    if (log_check in guildChannels) {
      log_type = log_check
    }
    const logChannel = await client.channels.fetch(guildChannels[log_type])

    let editor = newMessage.author
    let editMember = await newMessage.guild.members.fetch(editor.id)
    if (editMember) {
      editor = editMember
    }

    let player = {
      name: editor.displayName,
      avatar: editor.displayAvatarURL( { size: 128 } )
    }

    const embed = new RookEmbed(client, {
      color: colors["info"], // Orange for message updates
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
            value: `<@${newMessage.author.id}>` + " " +
              `(ID: \`${newMessage.author.id}\`)`
          }
        ],
        [
          // Guild Info
          {
            name: 'Guild',
            value: [
              newMessage.guild.name,
              `(ID: \`${newMessage.guild.id}\`)`
            ]
          },
          // Channel Link
          {
            name: 'Channel',
            value: [
              `<#${newMessage.channel.id}>`,
              `(ID: \`${newMessage.channel.id}\`)`
            ]
          }
        ],
        [
          // Message Link
          {
            name: 'Message',
            value: newMessage.url +
              `(ID: \`${newMessage.id}\`)`
          }
        ],
        [
          // Old Content
          {
            name: 'Old Content',
            value: oldContent.slice(0,1024) || '*No old content*' // Ensure there's always a default value
          }
        ],
        [
          // New Content
          {
            name: 'New Content',
            value: newContent.slice(0,1024) || '*No new content*' // Ensure there's always a default value
          }
        ]
      ]
    });

    // Send the embed to the log channel, if found and valid
    if (logChannel) {
      // @ts-ignore
      await logChannel.send({ embeds: [embed] })
    } else {
      console.warn('Log channel not found.')
    }

    // Optional: Save the edited message to a log file
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
    console.error('Error in logEditedMessage handler:', error)
  }
}
