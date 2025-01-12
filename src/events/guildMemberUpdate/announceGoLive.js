// @ts-nocheck

// GuildMember
// Formatters: inlineCode, italic, hyperlink
const { GuildMember, inlineCode, italic, hyperlink } = require('discord.js')
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
 * @param {GuildMember} oldMember
 * @param {GuildMember} newMember
 */
module.exports = async (client, oldMember, newMember) => {
  let result = false
  let messages = []

  if (!client) {
    messages.push("No Client")
    return [result, messages]
  }
  if (!oldMember) {
    messages.push("No Old Member")
    return [result, messages]
  }
  if (!newMember) {
    messages.push("No New Member")
    return [result, messages]
  }

  if (
    newMember?.presence &&
    newMember.presence.activities.length > 0
  ) {
    let stream_url = null
    let newActivities = newMember.presence.activities
    if (newActivities.length <= 0) {
      // messages.push(`No Activities for '${newMember.user.username}' [${newMember.id}]`)
      return [result, messages]
    }
    for (let activity in newActivities) {
      if (activity?.url && activity.url != "") {
        stream_url = activity.url
      }
    }
    if (!stream_url) {
      // messages.push(`No Stream URL for '${newMember.user.username}' [${newMember.id}]`)
      return [result, messages]
    }

    const guild = await newMember.guild
    if (!guild) {
      messages.push(`No Guild for '${newMember.user.username}' [${newMember.id}]`)
      return [result, messages]
    }

    const channels = await newMember.guild.channels
    if (!channels) {
      messages.push(`No Channels for '${newMember.guild.name}' [${newMember.guild.id}] for '${newMember.user.username}' [${newMember.id}]`)
      return [result, messages]
    }

    let props = {
      title: {
        text: "🔴Stream Started!🔴"
      },
      description: [
        `${newMember} has gone live!`,
        `Watch the stream ${hyperlink('on the web', stream_url)}!`
      ],
      playerTypes: {
        user: "guild",
        target: "target"
      },
      players: {
        user: {
          name: newMember.guild.name,
          avatar: newMember.guild.iconURL({ size: 128 })
        },
        target: {
          name: newMember.displayName,
          avatar: newMember.displayAvatarURL({ size: 128 })
        }
      }
    }
    let embed = new RookEmbed(client, props)

    let guildID = newMember.guild.id
    const guildChannelsPath = path.join(
      __dirname,
      "..",
      "..",
      "dbs",
      guildID,
      "channels"
    )
    if (!fs.existsSync(guildChannelsPath + ".json")) {
      messages.push(`Failed to fetch Guild Channels for '${newMember.guild.name}' [${newMember.guild.id}]`)
      return [result, messages]
    }

    const guildChannels = require(guildChannelsPath)
    let destChannelID = guildChannels["stream-alerts"]

    if (!destChannelID) {
      messages.push(`Stream Alerts channel not found for '${newMember.guild.name}' [${newMember.guild.id}]`)
      return [result, messages]
    }

    let channel = await guild?.channels.fetch(destChannelID)
    if (!channel) { return [false, []] }

    let this_package = { embeds: [ embed ] }
    result = await channel.send(this_package)

    messages.push(
      JSON.stringify(
        {
          guild: newMember.guild.name,
          member: newMember.user.username,
          stream: stream_url
        }
      )
    )
  }

  return [result, messages]
}
