// @ts-nocheck

// VoiceState
// Formatters: inlineCode, italic
const { VoiceState, inlineCode, italic } = require('discord.js')
// Rook-branded Client
const { RookClient } = require('../../classes/objects/rclient.class')
// Rook-branded Embed
const { RookEmbed } = require('../../classes/embed/rembed.class')
// Use Discord HammerTime
const timeFormat = require('../../utils/timeFormat')
const path = require('path')  // Easier filepath management
const fs = require('fs')      // Filesystem manipulation

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
      messages.push("No Channel ID")
      return [result, messages]
    }

    const guild = await newState.guild
    if (!guild) {
      messages.push("No Guild")
      return [result, messages]
    }

    const member = await newState.member
    if (!member) {
      messages.push("No Member")
      return [result, messages]
    }

    const channels = await newState.guild.channels
    if (!channels) {
      messages.push("No Channels")
      return [result, messages]
    }

    const channel = await channels.fetch(channelID)
    if (!channel) {
      messages.push("No Channel")
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
    let channelsJSONPath = path.join(
      __dirname,
      "..",
      "..",
      "dbs",
      guildID,
      "channels.json"
    )
    if (fs.existsSync(channelsJSONPath)) {
      // Find the Guild Channel to send the embed to
      let channelIDs = require(channelsJSONPath)
      if (!channelIDs) { return [false, []] }

      let channelID = channelIDs["stream-alerts"]
      if (!channelID) { return [false, []] }

      let guild = await client.guilds.fetch(guildID)
      if (!guild) { return [false, []] }

      let destChannel = await guild?.channels.fetch(channelID)
      if (!destChannel) { return [false, []] }

      let this_package = { embeds: [ embed ] }
      result = await destChannel.send(this_package)

      messages.push(
        JSON.stringify(
          {
            guild: member.guild.name,
            member: member.user.username,
            channel: channel.name
          }
        )
      )
    }
  }

  return [result, messages]
}
