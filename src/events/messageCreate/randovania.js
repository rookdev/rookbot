// @ts-nocheck

/**
 * Discord Stuff
 *  Chat Slash Command Interaction
 *  Guild Member
 *  Formatters
 *   codeBlock
 *   inlineCode
 *   hyperlink
 *   userMention
 */
const {
  ChatInputCommandInteraction,
  GuildMember,
  codeBlock,
  inlineCode,
  hyperlink,
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

  if (message.attachments.size < 1) {
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
  messages = messages.concat(newMessages) 
  // /DB

  if (!channelIDs) {
    messages.push(`Channel IDs not found for '${message.guild.name}' [${message.guild.id}]`)
    return [result, messages]
  }

  // let channelName = "multiworld-planning"
  let channelName = "bot-testing"
  let channelID   = channelIDs[channelName]
  if (message.channel.id != channelID) {
    // messages.push("Not target Channel ID!")
    return [result, messages]
  }

  let gameIDs = {
    fusion: "Metroid Fusion"
  }

  for (let [attachmentID, aData] of message.attachments) {
    let isRDVgame = aData.name.toLowerCase().includes("rdvgame")
    let isRDVpreset = aData.name.toLowerCase().includes("rdvpreset")
    if (isRDVgame || isRDVpreset) {
      let aJSON = await fileFuncs.getAURL(aData.url, "yaml")
      let info = isRDVgame ? aJSON.info : null
      let preset = isRDVgame ? info.presets[0] : aJSON

      let fields = [
        [
          {
            name: "Randovania Version",
            value: info ?
              hyperlink(
                inlineCode(info["randovania_version"]),
                `http://github.com/randovania/randovania/releases/tag/v${info['randovania_version']}`
              ) : ""
          },
          {
            name: "Randovania Commit",
            value: info ? 
              hyperlink(
                inlineCode(info["randovania_version_git"]),
                `http://github.com/randovania/randovania/commit/${info['randovania_version_git']}`
              ) : ""
          },
          {
            name: "Permalink",
            value: info ? codeBlock(info?.permalink) : ""
          }
        ],
        [
          {
            name: "Word Hash",
            value: info ? codeBlock(info["word_hash"]) : ""
          },
          {
            name: "Game",
            value: preset?.game && Object.keys(gameIDs).includes(preset?.game) ? gameIDs[preset.game] : preset?.game
          },
          {
            name: "Preset Name",
            value: preset?.name
          }
        ],
        [
          {
            name: "Starting Location",
            value: preset?.configuration["starting_location"][0]?.region + " - " + preset?.configuration["starting_location"][0]?.area
          }
        ]
      ]
      
      // Prepare the embed
      let embedTitle = ""
      embedTitle += "Randovania "
      embedTitle += (isRDVgame ? "Game": "Preset") + " "
      embedTitle += "Parser"
      const embed = new RookEmbed(client, {
        title: {
          text: embedTitle,
          emoji: "📝"
        },
        fields: fields
      })

      message.channel.send({ embeds: [embed] })
    }
  }

  return [result, messages]
}
