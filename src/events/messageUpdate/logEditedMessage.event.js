// @ts-nocheck

const { Message, hyperlink } = require('discord.js')
const { EventScript } = require('../../classes/event/eventscript.class')
const { RookClient } = require('../../classes/objects/rclient.class')
const mentionFuncs = require('../../utils/formatters/mentions')
const timeFormat = require('../../utils/formatters/timeFormat')
const getters = require('../../utils/guild/getters')
const moment = require('moment')

/**
 * @class
 * @this {LogEditedMessageEvent}
 * @public
 */
module.exports = class LogEditedMessageEvent extends EventScript {
  constructor(client) {
    let evtprops = {
      name: "logEditedMessage",
      event: "messageUpdate",
      label: "Message Edited",
      description: "Log to a channel and to disk when a message is edited"
    }
    super(
      client,
      {...evtprops}
    )
  }

  /**
   * 
   * @param {RookClient} client
   * @param {Message} oldMessage 
   * @param {Message} newMessage 
   * @returns 
   */
  async action(client, oldMessage, newMessage) {
    // this.messages.push(`/${this.name}: Event Action`)

    // Check for invalid or undefined data
    if (!newMessage) {
      this.messages.push(`${client.profile.emojis.fail} MessageUpdate event received invalid data:`, { oldMessage, newMessage })
      return false
    }

    let guild = await this.getProp(client, newMessage, "guild")
    // Ensure the message is in a guild and not from a bot
    if (!guild) {
      this.messages.push(`${client.profile.emojis.fail} MessageUpdate occurred outside of a guild:`, newMessage)
      return false
    }
    if (newMessage.author?.bot) {
      // messages.push(`${client.profile.emojis.warning} Message update from bot:`, newMessage)
      // If it's SahaBot
      if (newMessage.author.id === "572269659290861578") {
        // Get HashID
        let hashID = 0
        if (!newMessage?.embeds[0]?.fields) {
          return false
        }
        for (let field of newMessage.embeds[0].fields) {
          if (field.name == "Permalink") {
            hashID = field.value
          }
        }
        if (hashID) {
          let seedmeta = await new SeedMetaCommand(client)
          await seedmeta.execute(client, newMessage, { "hash-id": hashID })
        }
      }
      return false
    }

    // Fetch full messages if necessary
    if (oldMessage.partial) {
      try {
        oldMessage = await oldMessage.fetch()
      } catch (err) {
        this.messages.push(`${client.profile.emojis.fail} Failed to fetch old message:`, err)
        return false
      }
    }

    if (newMessage.partial) {
      try {
        newMessage = await newMessage.fetch()
      } catch (err) {
        console.error(`${client.profile.emojis.fail} Failed to fetch new message:`, err)
        return false
      }
    }

    // Handle cases where the old or new content is unavailable
    const oldContent = oldMessage.cleanContent.slice(0, 1024) ?? italic('(Content unavailable)')
    const newContent = newMessage.cleanContent.slice(0, 1024) ?? italic('(Content unavailable)')

    // Skip if the content hasn't changed
    if (oldMessage.content === newMessage.content) {
      // console.warn('  No content change detected.')
      return false
    }

    let editor = newMessage.author
    let editMember = await getters.getCachedMember(client, guild, editor.id)
    if (editMember) {
      editor = editMember
    }

    let player = {
      name: editor.displayName,
      avatar: await editor.displayAvatarURL( { size: 128 } )
    }

    let logProps = {
      color: client.profile.colors.info,
      title: {
        text: "[Log] Message Edited",
        emoji: "✏️"
      },
      players: {
        user: player,
        target: player
      },
      fields: [
        [
          {
            name: "Edited At",
            value: timeFormat(
              moment.utc().format("x"),
              { with: "relative" }
            )
          }
        ],
        [
          // Who wrote it?
          {
            name: 'Author',
            value: mentionFuncs.userMention(
              editor.id,
              { showID: true }
            )
          }
        ],
        [
          // Guild Info
          {
            name: 'Guild',
            value: mentionFuncs.guildMention(
              guild.name,
              guild.id,
              { showID: true }
            )
          },
          // Channel Link
          {
            name: 'Channel',
            value: mentionFuncs.channelMention(
              newMessage.channel.id,
              { showID: true }
            )
          }
        ],
        [
          // Message Link
          {
            name: 'Message',
            value: mentionFuncs.messageMention(
              newMessage.url,
              { showID: true }
            )
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
    }

    // client
    // guild
    // logging-<this> guildchannel key
    // embed props
    await this.logPost(
      client,
      guild,
      "messages",
      logProps
    )

    let logLines = [
      `Author:      ${editor.tag} (ID: ${editor.id})`,
      `Guild:       ${guild.name} (ID: ${guild.id})`,
      `Channel:     #${newMessage.channel.name} (ID: ${newMessage.channel.id})`,
      `Message ID:  ${newMessage.id}`,
      `Old Content: ${oldContent}`,
      `New Content: ${newContent}`
    ]
    // client
    // data
    // <region><this>.log
    await this.logFile(
      client,
      logLines,
      "editedMessages"
    )

    // appended messages for debugging
    await this.logMessages(
      "✏️",
      {
        guild: guild.name,
        member: editor.tag,
        channel: newMessage.channel.name,
        message: newMessage.id,
        action: "edit"
      }
    )
  }
}
