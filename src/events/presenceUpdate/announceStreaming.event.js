// @ts-nocheck

const { ActivityType, GuildMember, bold, italic, hyperlink } = require('discord.js')
const { EventScript } = require('../../classes/event/eventscript.class')
const { RookMessage } = require('../../classes/objects/rmessage.class')
const { RookClient } = require('../../classes/objects/rclient.class')
const { RookEmbed } = require('../../classes/embed/rembed.class')
const updateStreaming = require('../../utils/guild/updateStreaming')
const mentionFuncs = require('../../utils/formatters/mentions')
const timeFormat = require('../../utils/formatters/timeFormat')
const dbFuncs = require('../../utils/db/dbFuncs')
const getters = require('../../utils/guild/getters')
const moment = require('moment')

/**
 * @class
 * @this {AnnounceStreamingEvent}
 * @public
 */
module.exports = class AnnounceStreamingEvent extends EventScript {
  constructor(client) {
    let evtprops = {
      name: "announceStreaming",
      event: "presenceUpdate",
      label: "Announce Streaming",
      description: "Log to a channel when a member streams"
    }
    super(
      client,
      {...evtprops}
    )
  }

  /**
   * 
   * @param {RookClient}  client 
   * @param {Presence}    oldPresence 
   * @param {Presence}    newPresence 
   * @returns 
   */
  async action(client, oldPresence, newPresence) {
    // this.messages.push(`/${this.name}: Event Action`)

    let streamUpdate = await updateStreaming(
      client,
      this.event,
      this.name,
      oldPresence,
      newPresence
    )

    let sendDebug = false
    let showDebug = false

    if (streamUpdate.changesDetected) {
      // This Presence
      let thisPresence = null
      thisPresence = {
        guild: {
          name: newPresence.guild.name
        },
        userId: newPresence.userId,
        user: {
          displayName: newPresence.user.displayName
        },
        status: newPresence.status,
        oldStream: streamUpdate.oldStream,
        newStream: streamUpdate.newStream,
        newActivities: null,
        oldActivities: streamUpdate.old.activity
      }

      if (streamUpdate.oldStream != streamUpdate.newStream) {
        thisPresence.newActivities = streamUpdate.new.activity
      }
      if (showDebug) {
        // this.messages.push(JSON.stringify(thisPresence))
      }
    }

    if (!streamUpdate.wasStreaming && !streamUpdate.isStreaming) {
      return false
    }
    if (streamUpdate.wasStreaming && streamUpdate.isStreaming) {
      return false
    }

    let foundActivity = null
    if (newPresence.activities) {
      for (let activity of newPresence.activities) {
        if (activity.type == ActivityType.Streaming) {
          if (activity?.url) {
            foundActivity = activity
          }
        }
      }
    }

    let member = await newPresence.member

    if (
      (streamUpdate.startedStreaming || streamUpdate.updatedStream) &&
      foundActivity
    ) {
      const guild = await newPresence.guild
      if (!guild) {
        this.messages.push(`${client.profile.emojis.fail} No Guild`)
        return false
      }

      if (!member) {
        this.messages.push(`${client.profile.emojis.fail} No Member`)
        return false
      }

      let props = {
        title: {
          text: "🔴Go Live!🔴"
        },
        playerTypes: {
          user: "guild",
          target: "target"
        },
        players: {
          user: {
            name: guild.name,
            avatar: await guild.iconURL({ size: 128 })
          },
          target: {
            name: member.displayName,
            avatar: await member.displayAvatarURL({ size: 128 })
          }
        }
      }
      props.description = []
      props.description.push(`${member} has started streaming!`)
      props.description.push(bold(foundActivity.name))
      if (foundActivity.details) {
        props.description.push(italic(foundActivity.details))
      }
      props.description.push(`Watch them online ${hyperlink('here',foundActivity.url)}!`)

      let guildChannels = null

      // DB
      let dbRes = await dbFuncs.getDB(
        guild.id,
        "channels"
      )
      guildChannels = dbRes[0]
      this.messages.push(...dbRes[1])
      // /DB

      if (!guildChannels) {
        this.messages.push(`${client.profile.emojis.fail} Failed to fetch Guild Channels for ${mentionFuncs.guildMention(member.guild.name, member.guild.id, { showID: true, oneLine: true, textOnly: true })}`)
        return false
      }

      let destChannelType = "stream-alerts"
      if (streamUpdate["streamer-type"].includes("streaming-owner")) {
        destChannelType = "stream-alerts-owner"
      }
      let destChannelID = guildChannels[destChannelType]

      if (!destChannelID) {
        this.messages.push(`${client.profile.emojis.fail} Stream Alerts channel not found for ${mentionFuncs.guildMention(member.guild.name, member.guild.id, { showID: true, oneLine: true, textOnly: true })}`)
        return false
      }

      let destChannel = await getters.getCachedChannel(client, guild, destChannelID)
      if (!destChannel) { return false }

      let announceMessage = await new RookMessage(
        client,
        null,
        {
          channelName: destChannel.id,
          pages: [ props ]
        }
      )
      let result = await announceMessage.execute()
    }

    // console.log(streamUpdate)

    if (foundActivity?.url) {
      // appended messages for debugging
      await this.logMessages(
        "🔴",
        {
          guild: member.guild.name,
          member: member.user.tag,
          url: foundActivity.url,
          roles: streamUpdate.roles
        }
      )
    }
  }
}
