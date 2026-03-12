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
const { filesystem } = require('locutus/php')

/**
 * @class
 * @this {LogDeletedMessageEvent}
 * @public
 */
module.exports = class LogDeletedMessageEvent extends EventScript {
  constructor(client) {
    let evtprops = {
      name: "logDeletedMessage",
      event: "messageDelete",
      label: "Message Deleted",
      description: "Log to a channel and to disk when a message is deleted"
    }
    super(
      client,
      {...evtprops}
    )
  }

  /**
   * 
   * @param {RookClient} client 
   * @param {Message} deletedMessage 
   * @returns 
   */
  async action(client, deletedMessage) {
    // this.messages.push(`/${this.name}: Event Action`)

    if (!deletedMessage) {
      this.messages.push("No message!")
      return false
    }

    // If the message is partial, fetch the full message (if possible)
    if (deletedMessage.partial) {
      try {
        deletedMessage = deletedMessage.fetch()
      } catch (error) {
        this.messages.push(error.stack)
      }
    }

    // Skip logging system messages or messages with no content
    if (deletedMessage.system || !deletedMessage.content) {
      return false
    }

    let guild = await this.getProp(client, deletedMessage, "guild")
    const fetchedLogs = await guild?.fetchAuditLogs(
      {
        limit: 6,
        type: AuditLogEvent.MessageDelete
      }
    ).catch(console.error)
    const auditEntry = await fetchedLogs?.entries.find(
      a =>
        // Small filter function to make use of the little discord provides to narrow down the correct audit entry.
        a.target.id === deletedMessage.author.id &&
        a.extra.channel.id === deletedMessage.channel.id &&
        // Ignore entries that are older than 20 seconds to reduce false positives.
        Date.now() - a.createdTimestamp < 20 * 1000
    )
    let deleter = auditEntry?.executor ?? null
    if (deleter) {
      let deleterMember = await getters.getCachedMember(client, guild, deleter.id)
      if (deleterMember) {
        deleter = deleterMember
      }
    }

    let deletedAuthor = deletedMessage.author
    let deletedMember = null
    try {
      deletedMember = await getters.getCachedMember(client, guild, deletedAuthor.id)
    } catch (error) {

    }
    if (deletedMember) {
      deletedAuthor = deletedMember
    }

    let logFields = []
    let logPlayers = {
      target: {
        name: deletedAuthor.displayName,
        avatar: await deletedAuthor.displayAvatarURL({ size: 128 })
      }
    }
    let auditDateTime = moment.utc()
    if (auditEntry?.createdTimestamp) {
      auditDateTime = moment.utc(auditEntry.createdTimestamp)
    }
    if (auditDateTime) {
      logFields.push(
        [
          // Deleted DateTime
          {
            name: 'Deleted At',
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
            deletedMessage.author.id,
            {
              showID: true
            }
          )
        }
      ]
    )
    if (deleter && deleter?.id) {
      logPlayers.user = {
        name: deleter.displayName,
        avatar: await deleter.displayAvatarURL({ size: 128 })
      }
      logFields.push(
        // Deleted by someone we can capture
        [
          {
            name: 'Deleter',
            value: mentionFuncs.userMention(
              deleter.id,
              {
                showID: true
              }
            )
          }
        ]
      )
    } else {
      let clientMember = deletedMessage.guild.members.me
      if (clientMember) {
        logPlayers.user = {
          name: clientMember.displayName,
          avatar: await clientMember.displayAvatarURL({ size: 128 })
        }
      }
      logFields.push(
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
            deletedMessage.channel.id,
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
            deletedMessage.url,
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
          value: deletedMessage.cleanContent.slice(0,1024) ?? italic('No content')
        }
      ]
    )

    let logProps = {
      color: client.profile.colors.bad,
      title: {
        text: '[Log] Message Deleted',
        emoji: "🚮"
      },
      entities: logPlayers,
      playerTypes: { user: "user", target: "target" },
      fields: logFields
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
      `Author:     ${deletedMessage.author.tag} (ID: ${deletedMessage.author.id})`
    ]
    if (deleter) {
      logLines.push(
        `Deleter:     ${deleter.tag} (ID: ${deleter.id})`
      )
    } else {
      logLines.push(
        `Deleter:    Self/bot?`
      )
    }
    logLines.push(
      `Guild:      ${guild?.name} (ID: ${guild?.id})`,
      // @ts-ignore
      `Channel:    #${deletedMessage.channel.name} (ID: ${deletedMessage.channel.id})`,
      `Message ID: ${deletedMessage.id}`,
      `Content:    ${deletedMessage.content}`,
    )
    // client
    // data
    // <region><this>.log
    await this.logFile(
      client,
      logLines,
      "deletedMessages"
    )

    // appended messages for debugging
    await this.logMessages(
      "🚮",
      {
        guild: guild.name,
        member: deletedMessage.author.tag,
        action: "delete",
        channel: deletedMessage.channel.name,
        message: deletedMessage.id
      }
    )
  }
}
