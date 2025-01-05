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
  if (!client) {
    console.log("No Client")
    return false
  }
  if (!oldMember) {
    console.log("No Old Member")
    return false
  }
  if (!newMember) {
    console.log("No New Member")
    return false
  }

  if (
    newMember?.presence &&
    newMember.presence.activities.length > 0
  ) {
    let stream_url = ""
    let newActivities = newMember.presence.activities
    for (let activity in newActivities) {
      if (activity?.url) {
        stream_url = activity.url
      }
    }
    if (stream_url == "") {
      console.log(`   No Stream URL for '${newMember.user.username}' (ID: ${newMember.id})`)
      return false
    }

    const guild = await newMember.guild
    if (!guild) {
      console.log(`   No Guild for '${newMember.user.username}' (ID: ${newMember.id})`)
      return false
    }

    const channels = await newMember.guild.channels
    if (!channels) {
      console.log(`   No Channels for '${newMember.guild.name}' (ID: ${newMember.guild.id}) for '${newMember.user.username}' (ID: ${newMember.id})`)
      return false
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
      if (!channelIDs) { this.error = true; return }

      let channelID = channelIDs["stream-alerts"]
      if (!channelID) { this.error = true; return }

      let guild = await client.guilds.fetch(guildID)
      if (!guild) { this.error = true; return }

      let channel = await guild?.channels.fetch(channelID)
      if (!channel) { this.error = true; return }

      let this_package = { embeds: [ embed ] }
      await channel.send(this_package)
    }
  }
}
