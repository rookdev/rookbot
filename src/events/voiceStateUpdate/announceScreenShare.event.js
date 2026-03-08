// @ts-nocheck

const { VoiceState, hyperlink } = require('discord.js')
const { EventScript } = require('../../classes/event/eventscript.class')
const { RookMessage } = require('../../classes/objects/rmessage.class')
const { RookClient } = require('../../classes/objects/rclient.class')
const { RookEmbed } = require('../../classes/embed/rembed.class')
const mentionFuncs = require('../../utils/formatters/mentions')
const globalFuncs = require('../../utils/primitives/globalFuncs')
const timeFormat = require('../../utils/formatters/timeFormat')
const dbFuncs = require('../../utils/db/dbFuncs')
const getters = require('../../utils/guild/getters')
const moment = require('moment')
const updateStreaming = require('../../utils/guild/updateStreaming')

/**
 * @class
 * @this {AnnounceScreenShareEvent}
 * @public
 */
module.exports = class AnnounceScreenShareEvent extends EventScript {
  constructor(client) {
    let evtprops = {
      name: "announceScreenShare",
      event: "voiceStateUpdate",
      label: "Member Sharing Screen",
      description: "Log to a channel when a member shares their screen"
    }
    super(
      client,
      {...evtprops}
    )
  }

  /**
   * 
   * @param {RookClient} client 
   * @param {VoiceState} oldState 
   * @param {VoiceState} newState 
   * @returns 
   */
  async action(client, oldState, newState) {
    // this.messages.push(`/${this.name}: Event Action`)

    let streamUpdate = await updateStreaming(
      client,
      this.event,
      this.name,
      oldState,
      newState
    )

    if (!streamUpdate.changesDetected) {
      // do nothing
      return false
    }

    const guild = await this.getGuild(client, newState)
    const member = await newState.member
    let guildID = member.guild.id

    const channelID = await newState.channelId
    // if (!channelID) {
    //   messages.push(`${client.profile.emojis.fail} No Channel ID`)
    //   return [result, messages]
    // }

    const channels = await newState.guild.channels
    if (!channels) {
      this.messages.push(`${client.profile.emojis.fail} No Channels`)
      return false
    }

    let channel = null

    if (channelID) {
      channel = await getters.getCachedChannel(client, guild, channelID)
      // if (!channel) {
      //   this.messages.push(`${client.profile.emojis.fail} No Channel`)
      //   return false
      // }
    }

    let guildRoles = null

    if (newState.suppress) {
      return false
    }

    if (
      streamUpdate.startedStreaming &&
      newState.channelId
    ) {
      let props = {
        title: {
          text: "🔴Screen Share!🔴"
        },
        description: [
          `${member} has started sharing their screen!`,
          `Join them in ${channel}!`
        ],
        playerTypes: {
          user: "guild",
          target: "target"
        },
        players: {
          user: {
            name: member.guild.name,
            avatar: await member.guild.iconURL({ size: 128 })
          },
          target: {
            name: member.displayName,
            avatar: await member.displayAvatarURL({ size: 128 })
          }
        }
      }

      let guildChannels = null
      let dbRes = await dbFuncs.getDB(
        guildID,
        "channels"
      )
      guildChannels = dbRes[0]
      this.messages.push(...dbRes[1])

      if (!guildChannels) {
        this.messages.push(`${client.profile.emojis.fail} Failed to fetch Guild Channels for ${mentionFuncs.guildMention(fetchedMember.guild.name, fetchedMember.guild.id, { showID: true, oneLine: true, textOnly: true })}`)
        return false
      }

      let destChannelID = [
        guildChannels["stream-alerts-owner"],
        guildChannels["stream-alerts"]
      ]

      if (globalFuncs.empty(destChannelID)) {
        this.messages.push(`${client.profile.emojis.fail} Stream Alerts channel not found for ${mentionFuncs.guildMention(fetchedMember.guild.name, fetchedMember.guild.id, { showID: true, oneLine: true, textOnly: true })}`)
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

    let logMessage = JSON.parse(streamUpdate.new)
    logMessage = {
      ...logMessage,
      ...streamUpdate
    }
    delete logMessage.event
    delete logMessage.script
    this.messages.push(...logMessage.messages)
    delete logMessage.messages
    delete logMessage.old
    delete logMessage.new
    await this.logMessages(
      "🔴",
      logMessage
    )
  }
}
