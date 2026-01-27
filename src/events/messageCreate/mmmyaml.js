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

const fileFuncs = require('../../utils/fs/fileFuncs')
const dbFuncs = require('../../utils/db/dbFuncs')

module.exports = async (client, message) => {
  let result = false
  let messages = []

  // Reasons to bail
  // If no message
  if (! message) {
    // console.log("No Message")
    return [result, messages]
  }
  // If no guild
  if (! message.guild) {
    // console.log("No Guild")
    return [result, messages]
  }
  // If no channel
  if (! message.channel) {
    // console.log("No Channel")
    return [result, messages]
  }

  if (message.author.id == client.user.id) {
    // console.log("It's the Bot")
    return [result, messages]
  }

  if (message.attachments.size < 1) {
    // console.log("No attachments!")
    return [result, messages]
  }

  let channelIDs = null

  // DB
  let dbRes = await dbFuncs.getDB(
    message.guild.id,
    "channels"
  )
  channelIDs = dbRes[0]
  messages = dbRes[1]
  // /DB

  if (!channelIDs) {
    messages.push(`Channel IDs not found for '${message.guild.name}' [${message.guild.id}]`)
    return [result, messages]
  }

  // let channelName = "multiworld-planning"
  let channelName = "bot-testing"
  let channelID   = channelIDs[channelName]
  if (message.channel.id != channelID) {
    // console.log("Not target Channel ID!")
    return [result, messages]
  }

  for (let [attachmentID, aData] of message.attachments) {
    if (aData.name.toLowerCase().includes("yaml") || aData.name.toLowerCase().includes("yml")) {
      // console.log(aData)
      // console.log(aData.name + ": " + aData.url)
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
