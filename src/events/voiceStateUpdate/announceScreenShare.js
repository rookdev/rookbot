// @ts-nocheck

// VoiceState
// Formatters: inlineCode, italic
const { VoiceState, inlineCode, italic } = require('discord.js')
// Rook-branded Client
const { RookClient } = require('../../classes/objects/rclient.class')
// Rook-branded Embed
const { RookEmbed } = require('../../classes/embed/rembed.class')
const globalFuncs = require('../../utils/primitives/globalFuncs')
// Use Discord HammerTime
const timeFormat = require('../../utils/formatters/timeFormat')
const fileFuncs = require('../../utils/fs/fileFuncs')
const dbFuncs = require('../../utils/db/dbFuncs')
const getters = require('../../utils/guild/getters')

/**
 * Logs edited messages from the server.
 * @param {RookClient} client
 * @param {VoiceState} oldState
 * @param {VoiceState} newState
 */
module.exports = async (client, oldState, newState) => {
  let result = false
  let messages = []

  let wasStreaming = oldState.streaming
  let isStreaming = newState.streaming
  let sendAlert = false
  let sendDebug = false
  let roles = {}

  if (!wasStreaming && !isStreaming) {
    // do nothing
    return [result, messages]
  }

  const guild = await newState.guild
  if (!guild) {
    messages.push(`${client.profile.emojis.fail} No Guild`)
    return [result, messages]
  }

  const member = await newState.member
  if (!member) {
    messages.push(`${client.profile.emojis.fail} No Member`)
    return [result, messages]
  }

  let guildID = member.guild.id

  let guildRoles = {}

  // DB
  let dbRes = await dbFuncs.getDB(
    guildID,
    "roles"
  )
  guildRoles = dbRes[0]
  messages = dbRes[1]
  // /DB

  const channelID = await newState.channelId
  // if (!channelID) {
  //   messages.push(`${client.profile.emojis.fail} No Channel ID`)
  //   return [result, messages]
  // }

  const channels = await newState.guild.channels
  if (!channels) {
    messages.push(`${client.profile.emojis.fail} No Channels`)
    return [result, messages]
  }

  let channel = null

  if (channelID) {
    channel = await getters.getCache(client, newState.guild, "channels", channelID)
    // if (!channel) {
    //   messages.push(`${client.profile.emojis.fail} No Channel`)
    //   return [result, messages]
    // }
  }

  let stoppedStreaming = wasStreaming && !isStreaming
  let disconnectedVoice = wasStreaming && isStreaming && !newState?.channelId

  if (
    (
      stoppedStreaming ||
      disconnectedVoice
    ) &&
    guildRoles
  ) {
    if (!roles?.removed) {
      roles.removed = []
    }
    // Check owner
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
    return [result, messages]
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
      messages = dbRes[1]

      if (!guildChannels) {
        messages.push(`${client.profile.emojis.fail} Failed to fetch Guild Channels for '${fetchedMember.guild.name}' [${fetchedMember.guild.id}]`)
        return [result, messages]
      }

      let destChannelID = [
        guildChannels["stream-alerts-owner"],
        guildChannels["stream-alerts"]
      ]

      if (globalFuncs.empty(destChannelID)) {
        messages.push(`${client.profile.emojis.fail} Stream Alerts channel not found for '${member.guild.name}' [${member.guild.id}]`)
        return [result, messages]
      }

      let destChannel = await getters.getCache(client, guild, "channels", destChannelID)
      if (!destChannel) { return [false, []] }

      let this_package = { embeds: [ embed ] }
      result = await destChannel.send(this_package)
    }
  }

  if (sendAlert || sendDebug) {
    messages.push(
      "🔴 " +
      JSON.stringify(
        {
          guild: member.guild.name,
          member: member.user.tag,
          channel: channel?.name,
          wasStreaming: wasStreaming,
          isStreaming: isStreaming,
          roles: roles
        }
      )
    )
  }

  return [result, messages]
}
