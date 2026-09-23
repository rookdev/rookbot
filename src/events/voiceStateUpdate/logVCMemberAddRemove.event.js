// @ts-nocheck

const { GuildMember, VoiceState } = require('discord.js')
const { EventScript } = require('../../classes/event/eventscript.class')
const { RookClient } = require('../../classes/objects/rclient.class')
const mentionFuncs = require('../../utils/formatters/mentions')
const timeFormat = require('../../utils/formatters/timeFormat')
const dbFuncs = require('../../utils/db/dbFuncs')
const getters = require('../../utils/guild/getters')
const moment = require('moment')

/**
 * @class
 * @this {LogVCMemberAddRemoveEvent}
 * @public
 */
module.exports = class LogVCMemberAddRemoveEvent extends EventScript {
  constructor(client) {
    let evtprops = {
      name: "logVCMemberAddRemove",
      event: "voiceStateUpdate",
      label: "Member Joins/Leaves Voice Channel",
      description: "Log to a channel and to disk when a member joins or leaves a voice channel"
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
    let logProps = {}
    logProps.color = client.profile.colors.info
    logProps.title = { text: "[Log] Member Joined/Left VC", emoji: "🔊" }

    let guild = null
    let state = null
    let status = ""
    let channel = null
    if (oldState) {
      // Old State
      let oldGuild = await getters.getGuild(client, oldState)
      guild = oldGuild
      if (oldState.channelId) {
        // Old State had a Channel
        // We've been connected
        let oldChannel = await getters.getCachedChannel(client, oldGuild, oldState.channelId)
        channel = oldChannel
      } else {
        // Old state didn't have a channel
        // We just now connected
        state = oldState
        status = "connected"
        logProps.color = client.profile.colors.good
        logProps.title.text = "[Log] Member Joined VC"
        logProps.title.emoji = "👋🔊"
      }
    }
    if (newState) {
      // New State
      let newGuild = await getters.getGuild(client, newState)
      guild = newGuild
      if (newState.channelId) {
        // New State had a channel
        // We've been connected
        let newChannel = await getters.getCachedChannel(client, newGuild, newState.channelId)
        channel = newChannel
      } else {
        // New State doesn't have a channel
        // We just now disconnected
        state = newState
        status = "disconnected"
        logProps.color = client.profile.colors.bad
        logProps.title.text = "[Log] Member Left VC"
        logProps.title.emoji = "🚶‍♂️🔊"
      }
    }

    if (!guild) { return false }
    if (!state) { return false }

    let dbRes = await dbFuncs.getDB(guild.id, "autoresponders", "", "fs", true)
    let responses = dbRes[0]
    this.messages.push(...dbRes[1])

    if (!responses["keys"]) { return false }
    if (responses["keys"].indexOf("vclogs") == -1) { return false }

    logProps.playerTypes = {
      user: "guild",
      target: "target"
    }
    logProps.entities = {
      guild: {
        name: guild.name,
        avatar: await guild.iconURL({ size: 128 })
      },
      target: {
        name: state.member.displayName,
        avatar: await state.member.displayAvatarURL({ size: 128 })
      }
    }

    logProps.fields = []
    logProps.fields.push(
      [
        {
          name: "Member",
          value: mentionFuncs.userMention(state.id)
        }
      ]
    )
    logProps.fields.push(
      [
        {
          name: "Channel",
          value: mentionFuncs.channelMention(channel.id)
        }
      ]
    )
    logProps.fields.push(
      [
        {
          name: "Guild",
          value: mentionFuncs.guildMention(guild.name, guild.id)
        }
      ]
    )
    logProps.fields.push(
      [
        {
          name: "Self Deaf",
          value: state.selfDeaf ? "🚫👂" : "👂"
        },
        {
          name: "Self Mute",
          value: state.selfMute ? "🔇" : "🔊"
        },
        {
          name: "Self Video",
          value: state.selfVideo ? "🚫📹" : "📹"
        }
      ],
      [
        {
          name: "Server Deaf",
          value: state.serverDeaf ? "🚫👂" : "👂"
        },
        {
          name: "Server Mute",
          value: state.serverMute ? "🔇" : "🔊"
        }
      ]
    )

    logProps.description = []
    logProps.description.push("**Members**")
    let memberCount = 0;
    for (let [memberID, member] of await channel.members) {
      logProps.description.push(mentionFuncs.userMention(memberID))
      memberCount++;
    }
    if (memberCount == 0) {
      logProps.description.push("*None*")
    }

    // client
    // guild
    // logging-<this> guildchannel key
    // embed props
    await this.logPost(
      client,
      guild,
      "vclogs",
      logProps
    )

    let logLines = []

    // client
    // data
    // <region><this>.log
    await this.logFile(
      client,
      logLines,
      "vclogs"
    )

    // appended messages for debugging
    await this.logMessages(
      logProps.title.emoji,
      {
        guild: guild.name,
        member: state.member.user.tag,
        channel: channel.name,
        action: status
      }
    )
  }
}
