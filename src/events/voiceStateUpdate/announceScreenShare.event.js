// @ts-nocheck

const { VoiceState, hyperlink } = require('discord.js')
const { EventScript } = require('../../classes/event/eventscript.class')
const { RookClient } = require('../../classes/objects/rclient.class')
const { RookEmbed } = require('../../classes/embed/rembed.class')
const mentionFuncs = require('../../utils/formatters/mentions')
const globalFuncs = require('../../utils/primitives/globalFuncs')
const timeFormat = require('../../utils/formatters/timeFormat')
const dbFuncs = require('../../utils/db/dbFuncs')
const getters = require('../../utils/guild/getters')
const moment = require('moment')

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
    let wasStreaming = oldState.streaming
    let isStreaming = newState.streaming
    let sendAlert = false
    let sendDebug = false
    let roles = {}

    if (!wasStreaming && !isStreaming) {
      // do nothing
      return false
    }

    const guild = await newState.guild
    if (!guild) {
      this.messages.push(`${client.profile.emojis.fail} No Guild`)
      return false
    }

    const member = await newState.member
    if (!member) {
      this.messages.push(`${client.profile.emojis.fail} No Member`)
      return false
    }

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
      channel = await getters.getCache(client, newState.guild, "channels", channelID)
      // if (!channel) {
      //   this.messages.push(`${client.profile.emojis.fail} No Channel`)
      //   return false
      // }
    }

    let stoppedStreaming = wasStreaming && !isStreaming
    let disconnectedVoice = wasStreaming && isStreaming && !newState?.channelId

    let guildRoles = null

    if (
      (
        stoppedStreaming ||
        disconnectedVoice
      )
    ) {
      if (!roles?.removed) {
        roles.removed = []
      }
      // Check owner
      if (!guildRoles) {
        // DB
        let dbRes = await dbFuncs.getDB(
          guildID,
          "roles"
        )
        guildRoles = dbRes[0]
        // this.messages.push(...dbRes[1])
        // /DB
      }
      let OWNER_ROLES = guildRoles["owner"] ?? null
      if (OWNER_ROLES) {
        let hasOwner = await member.roles.cache.some(r=>OWNER_ROLES.includes(r.name))
        if (hasOwner) {
          sendDebug = true
          // Check owner streaming
          let OWNER_STREAMING_ROLES = guildRoles["streaming-owner"] ?? null
          if (OWNER_STREAMING_ROLES) {
            if (await member.roles.cache.some(r=>OWNER_STREAMING_ROLES.includes(r.name))) {
              for (let roleName of OWNER_STREAMING_ROLES) {
                let role = await getters.getCache(client, oldState.guild, "roles", roleName)
                roles.removed.push(roleName)
                await member.roles.remove(role)
              }
            }
          }
        }
      }

      // Check member streaming
      let STREAMING_ROLES = guildRoles["streaming-member"] ?? null
      if (STREAMING_ROLES) {
        let isStreamer = await member.roles.cache.some(r=>STREAMING_ROLES.includes(r.name))
        if (isStreamer) {
          sendDebug = true
          for (let roleName of STREAMING_ROLES) {
            let role = await getters.getCache(client, oldState.guild, "roles", roleName)
            roles.removed.push(roleName)
            await member.roles.remove(role)
          }
        }
      }
    }

    if (newState.suppress) {
      return false
    }

    if (
      !wasStreaming &&
      isStreaming &&
      newState.channelId
    ) {
      // Check owner
      if (!roles?.added) {
        roles.added = []
      }
      if (!guildRoles) {
        // DB
        let dbRes = await dbFuncs.getDB(
          guildID,
          "roles"
        )
        guildRoles = dbRes[0]
        // this.messages.push(...dbRes[1])
        // /DB
      }
      let OWNER_ROLES = guildRoles["owner"] ?? null
      if (OWNER_ROLES) {
        let hasOwner = await member.roles.cache.some(r=>OWNER_ROLES.includes(r.name))
        if (hasOwner) {
          sendAlert = true
          // Check owner streaming
          let OWNER_STREAMING_ROLES = guildRoles["streaming-owner"] ?? null
          if (OWNER_STREAMING_ROLES) {
            for (let roleName of OWNER_STREAMING_ROLES) {
              let role = await getters.getCache(client, newState.guild, "roles", roleName)
              roles.added.push(roleName)
              await member.roles.add(role)
            }
          }
        }
      }
      // Check member streaming
      let STREAMING_ROLES = guildRoles["streaming-member"] ?? null
      let STREAMER_ROLES = guildRoles["stream-team"] ?? null
      if (STREAMING_ROLES) {
        let isStreamer = true
        if (STREAMER_ROLES) {
          isStreamer = false
          isStreamer = await member.roles.cache.some(r=>STREAMER_ROLES.includes(r.name))
        }
        if (isStreamer) {
          sendAlert = true
          for (let roleName of STREAMING_ROLES) {
            let role = await getters.getCache(client, newState.guild, "roles", roleName)
            roles.added.push(roleName)
            await member.roles.add(role)
          }
        }
      }

      if (sendAlert) {
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
              avatar: member.guild.iconURL({ size: 128 })
            },
            target: {
              name: member.displayName,
              avatar: member.displayAvatarURL({ size: 128 })
            }
          }
        }
        let embed = new RookEmbed(client, props)

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

        let destChannel = await getters.getCache(client, guild, "channels", destChannelID)
        if (!destChannel) { return false }

        let this_package = { embeds: [ embed ] }
        let result = await destChannel.send(this_package)
      }
    }

    await this.logMessages(
      "🔴",
      {
        guild: member.guild.name,
        member: member.user.tag,
        channel: channel?.name,
        wasStreaming: wasStreaming,
        isStreaming: isStreaming,
        roles: roles
      }
    )
  }
}
