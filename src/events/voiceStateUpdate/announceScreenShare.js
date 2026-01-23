// @ts-nocheck

// VoiceState
// Formatters: inlineCode, italic
const { VoiceState, inlineCode, italic } = require('discord.js')
// Rook-branded Client
const { RookClient } = require('../../classes/objects/rclient.class')
// Rook-branded Embed
const { RookEmbed } = require('../../classes/embed/rembed.class')
// Use Discord HammerTime
const timeFormat = require('../../utils/formatters/timeFormat')
const fileFuncs = require('../../utils/fs/fileFuncs')
const dbFuncs = require('../../utils/db/dbFuncs')

/**
 * Logs edited messages from the server.
 * @param {RookClient} client
 * @param {VoiceState} oldState
 * @param {VoiceState} newState
 */
module.exports = async (client, oldState, newState) => {
  let result = false
  let messages = []

  if (
    !oldState.streaming &&
    newState.streaming &&
    newState.channelId &&
    !newState.suppress
  ) {
    const channelID = await newState.channelId
    if (!channelID) {
      messages.push(`${client.profile.emojis.fail} No Channel ID`)
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

    const channels = await newState.guild.channels
    if (!channels) {
      messages.push(`${client.profile.emojis.fail} No Channels`)
      return [result, messages]
    }

    const channel = await channels.fetch(channelID)
    if (!channel) {
      messages.push(`${client.profile.emojis.fail} No Channel`)
      return [result, messages]
    }

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

    let guildID = member.guild.id
    const guildChannels = await dbFuncs.getDB(
      guildID,
      "channels"
    )
    if (!guildChannels) {
      messages.push(`${client.profile.emojis.fail} Failed to fetch Guild Channels for '${fetchedMember.guild.name}' [${fetchedMember.guild.id}]`)
      return [result, messages]
    }

    let destChannelID = guildChannels["stream-alerts"]

    if (!destChannelID) {
      messages.push(`${client.profile.emojis.fail} Stream Alerts channel not found for '${member.guild.name}' [${member.guild.id}]`)
      return [result, messages]
    }

    let destChannel = await guild?.channels.fetch(destChannelID)
    if (!destChannel) { return [false, []] }

    let this_package = { embeds: [ embed ] }
    result = await destChannel.send(this_package)

    messages.push(
      "🔴 " +
      JSON.stringify(
        {
          guild: member.guild.name,
          member: member.user.tag,
          channel: channel.name
        }
      )
    )
  }

  return [result, messages]
}
