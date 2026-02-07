// @ts-nocheck

/**
 * Discord Stuff
 *  Chat Slash Command Interaction
 *  Guild Member
 *  Formatters
 *   userMention
 */
const {
  ChatInputCommandInteraction,
  GuildMember,
  userMention
} = require('discord.js')

// Rook-branded Client
const { RookClient } = require('../../classes/objects/rclient.class')
// Rook-branded Embed
const { RookEmbed } = require('../../classes/embed/rembed.class')
const mentionFuncs = require('../../utils/formatters/mentions')
const fileFuncs = require('../../utils/fs/fileFuncs')
const dbFuncs = require('../../utils/db/dbFuncs')

module.exports = async (client, message) => {
  let result = false
  let messages = []

  // Reasons to bail
  // If no message
  if (! message) {
    // messages.push("No Message")
    return [result, messages]
  }
  // If no guild
  if (! message.guild) {
    // messages.push("No Guild")
    return [result, messages]
  }
  // If no channel
  if (! message.channel) {
    // messages.push("No Channel")
    return [result, messages]
  }

  if (message.author.id == client.user.id) {
    // messages.push("It's the Bot")
    return [result, messages]
  }

  if (message?.attachments?.size <= 0) {
    // messages.push("No attachments!")
    return [result, messages]
  }

  let channelIDs = null

  // DB
  let dbRes = await dbFuncs.getDB(
    message.guild.id,
    "channels"
  )
  channelIDs = dbRes[0]
  let newMessages = dbRes[1]
  // messages = messages.concat(newMessages)
  // /DB

  if (!channelIDs) {
    messages.push(`Channel IDs not found for ${mentionFuncs.guildMention(message.guild.name, message.guild.id, { showID: true, oneLine: true, textOnly: true })}`)
    return [result, messages]
  }

  // let channelName = "multiworld-planning"
  let channelName = "bot-testing"
  let channelID   = channelIDs[channelName]
  if (message.channel.id != channelID) {
    // messages.push("Not target Channel ID!")
    return [result, messages]
  }

  for (let [attachmentID, aData] of message.attachments) {
    if (aData.name.toLowerCase().includes("yaml") || aData.name.toLowerCase().includes("yml")) {
      // messages.push(aData)
      // messages.push(aData.name + ": " + aData.url)
      let aYaml = await fileFuncs.getAURL(aData.url)

      let yamlFields = [
        [
          {
            name: 'Player',
            value: aYaml["name"]
          },
          {
            name: 'Game',
            value: aYaml["game"]
          }
        ]
      ]
      
      // Prepare the YAML embed
      const yamlEmbed = new RookEmbed(client, {
        title: {
          text: 'YAML Parser',
          emoji: "📝"
        },
        fields: yamlFields
      })

      message.channel.send({ embeds: [yamlEmbed] })
    }
  }

  return [result, messages]
}
