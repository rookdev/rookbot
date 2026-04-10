// @ts-nocheck

const { GuildMember, hyperlink, AuditLogEvent } = require('discord.js')
const { EventScript } = require('../../classes/event/eventscript.class')
const { RookClient } = require('../../classes/objects/rclient.class')
const timeConversion = require('../../utils/formatters/timeConversion')
const mentionFuncs = require('../../utils/formatters/mentions')
const timeFormat = require('../../utils/formatters/timeFormat')
const dbFuncs = require('../../utils/db/dbFuncs')
const getters = require('../../utils/guild/getters')
const moment = require('moment')

/**
 * @class
 * @this {LogPinnedMessageEvent}
 * @public
 */
module.exports = class LogPinnedMessageEvent extends EventScript {
  constructor(client) {
    let evtprops = {
      name: "logPinnedMessage",
      event: "messageUpdate",
      label: "Message Pinned",
      description: "Log to a channel when a message is pinned"
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

    if (!oldMessage) {
      this.messages.push("No old message!")
      return false
    }

    if (!newMessage) {
      this.messages.push("No new message!")
      return false
    }

    // If the message is partial, fetch the full message (if possible)
    if (newMessage.partial) {
      try {
        newMessage = newMessage.fetch()
      } catch (error) {
        this.messages.push(error.stack)
      }
    }

    // Skip logging system messages or messages with no content
    if (newMessage.system || !newMessage.content) {
      return false
    }

    if (!newMessage.pinned) {
      return false
    }

    let guild = await this.getProp(client, newMessage, "guild")
    const fetchedLogs = await guild?.fetchAuditLogs(
      {
        limit: 6,
        type: AuditLogEvent.MessagePin
      }
    ).catch(console.error)
    const auditEntry = await fetchedLogs?.entries.find(
      a =>
        // Small filter function to make use of the little discord provides to narrow down the correct audit entry.
        a.target.id === newMessage.author.id &&
        a.extra.channel.id === newMessage.channel.id &&
        // Ignore entries that are older than 20 seconds to reduce false positives.
        Date.now() - a.createdTimestamp < 20 * 1000
    )
    let pinner = auditEntry?.executor ?? null
    if (pinner) {
      let pinnerMember = await getters.getCachedMember(client, guild, pinner.id)
      if (pinnerMember) {
        pinner = pinnerMember
      }
    }

    let newContent = ""
    if (newMessage?.cleanContent) {
      newContent = newMessage.cleanContent.slice(0, 1024)
    } else if (newMessage?.content) {
      newContent = newMessage.content.slice(0, 1024)
    } else {
      newContent = italic("(Content unavailable)")
    }

    let pinnedAuthor = newMessage.author
    let pinnedMember = null
    try {
      pinnedMember = await getters.getCachedMember(client, guild, pinnedAuthor.id)
    } catch (error) {

    }
    if (pinnedMember) {
      pinnedAuthor = pinnedMember
    }

    let logFields = []
    let logPlayers = {
      target: {
        name: pinnedAuthor.displayName,
        avatar: await pinnedAuthor.displayAvatarURL({ size: 128 })
      }
    }
    let auditDateTime = moment.utc()
    if (auditEntry?.createdTimestamp) {
      auditDateTime = moment.utc(auditEntry.createdTimestamp)
    }
    if (auditDateTime) {
      logFields.push(
        [
          // Pinned DateTime
          {
            name: 'Pinned At',
            value: auditDateTime
              ? timeFormat(auditDateTime.format("x"), { with: "relative" })
              : 'Unknown'
          }
        ]
      )
    }

    logFields.push(
      [
        // Who wrote this?
        {
          name: 'Author',
          value: mentionFuncs.userMention(
            newMessage.author.id,
            {
              showID: true
            }
          )
        }
      ]
    )
    if (pinner && pinner?.id) {
      if ([
        "1218450020118822912"  // Trident Esports Carl-bot
      ].includes(pinner.id)) {
        return false
      }
      logPlayers.user = {
        name: pinner.displayName,
        avatar: await pinner.displayAvatarURL({ size: 128 })
      }
      logFields.push(
        // pinned by someone we can capture
        [
          {
            name: 'Pinner',
            value: mentionFuncs.userMention(
              pinner.id,
              {
                showID: true
              }
            )
          }
        ]
      )
    } else {
      let clientMember = newMessage.guild.members.me
      if (clientMember) {
        logPlayers.user = {
          name: clientMember.displayName,
          avatar: await clientMember.displayAvatarURL({ size: 128 })
        }
      }
      logFields.push(
        // pinned by someone we can't capture
        // Usually either self or a bot
        [
          {
            name: 'Pinner',
            value: `Probably self or a bot`
          }
        ]
      )
    }

    logFields.push(
      [
        // Guild Info
        {
          name: 'Guild',
          value: mentionFuncs.guildMention(
            guild.name,
            guild.id,
            {
              showID: true
            }
          )
        },
        // Channel Link
        {
          name: 'Channel',
          value: mentionFuncs.channelMention(
            newMessage.channel.id,
            {
              showID: true
            }
          )
        }
      ],
      [
        // Message Link
        {
          name: 'Message',
          value: mentionFuncs.messageMention(
            newMessage.url,
            {
              showID: true
            }
          )
        }
      ],
      [
        // Message Content
        {
          name: 'Content',
          value: newContent
        }
      ]
    )

    let logProps = {
      color: client.profile.colors.info,
      title: {
        text: '[Log] Message Pinned',
        emoji: "📌"
      },
      entities: logPlayers,
      playerTypes: {
        user: "user",
        target: "user"
      },
      fields: logFields
    }

    // client
    // guild
    // logging-<this> guildchannel key
    // embed props
    await this.logPost(
      client,
      guild,
      "pins",
      logProps
    )

    let logLines = [
      `Author:     ${newMessage.author.tag} (ID: ${newMessage.author.id})`
    ]
    if (pinner) {
      logLines.push(
        `Pinner:     ${pinner.tag} (ID: ${pinner.id})`
      )
    } else {
      logLines.push(
        `Pinner:    Self/bot?`
      )
    }
    logLines.push(
      `Guild:      ${guild?.name} (ID: ${guild?.id})`,
      // @ts-ignore
      `Channel:    #${newMessage.channel.name} (ID: ${newMessage.channel.id})`,
      `Message ID: ${newMessage.id}`,
      `Content:    ${newMessage.content}`,
    )
    // client
    // data
    // <region><this>.log
    // await this.logFile(
    //   client,
    //   logLines,
    //   "newMessages"
    // )

    // appended messages for debugging
    await this.logMessages(
      "📌",
      {
        guild: guild.name,
        member: newMessage.author.tag,
        action: "pin",
        channel: newMessage.channel.name,
        message: newMessage.id
      }
    )
  }
}
