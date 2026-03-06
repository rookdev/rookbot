// @ts-nocheck

/**
 * Discord Stuff
 *  Chat Slash Command Interaction
 *  Guild Member
 *  Formatters
 *   codeBlock
 *   inlineCode
 *   bold
 *   italic
 *   userMention
 */
const {
  ChatInputCommandInteraction,
  GuildMember,
  codeBlock,
  inlineCode,
  bold,
  italic,
  userMention
} = require('discord.js')

const mentionFuncs = require('../../utils/formatters/mentions')
const PingCommand = require('../../commands/diag/ping')
// Use Discord HammerTime
const timeFormat = require('../../utils/formatters/timeFormat')
const fileFuncs = require('../../utils/fs/fileFuncs')
const numFuncs = require('../../utils/primitives/numFuncs')
const getters = require('../../utils/guild/getters')
const moment = require('moment')
const fs = require('fs')      // Filesystem manipulation

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

  let emoji = ""

  const targetUserId = message.author.id
  let targetUser = null
  try {
    targetUser = await getters.getCachedUser(client, targetUserId)
  } catch(err) {
    // messages.push(`No user found for seener ${mentionFuncs.userMention(message.author.id, { showID: true, oneLine: true, textOnly: true })}`)
    return [result, messages]
  }

  // Get the guild member (to fetch nickname if present)
  let guildMember = null
  try {
    let messageGuild = await getters.getCachedGuild(client, message.guildId)
    guildMember = await getters.getCachedMember(client, messageGuild, targetUserId)
  } catch(err) {
    messages.push(`No guild member found for seener ${mentionFuncs.userMention(message.author.id, { showID: true, oneLine: true, textOnly: true })}`)
    return [result, messages]
  }

  const user = guildMember?.user ?? targetUser

  let pretty_name = "Message_Stamp".split("_").map(x=>x.ucfirst()).join(" ")

  // LogFile for ACTION
  const DEV = !process.env.ENV_ACTIVE.startsWith("prod")
  let logFilePath = fileFuncs.getAPath(
    [
      "src",
      "botlogs"
    ],
    ((DEV ? "DEV" : "") + "member" + pretty_name.replace(" ", "") + "s.log")
  )
  // https://discord.com/channels/745409743593406634/1325367661755895890/1329353927933558810
  // GID: [18]
  // CID: [19]
  // MID: [19]
  let now = moment.utc()
  let pad = 20
  let userIDStr = `U:${user.id.padEnd(pad)}` + `;`
  let guildIDStr = `G:${message.guild.name}:[${message.guild.id}]`
  let logEntry = [
    userIDStr +
    `T:${now.toISOString()}` + `;` +
    `C:${message.channel.id.padEnd(pad)}` + `;` + 
    `M:${message.id.padEnd(pad)}` + `;` + 
    `N:${user.tag.padEnd(pad)}` + `;` +  
    userIDStr +
    guildIDStr
  ]

  // messages.push(logEntry)

  let entries = fileFuncs.getAFile(logFilePath)
  if (entries) {
    // messages.push("We've got entries!")
    if (entries.includes(userIDStr + guildIDStr)) {
      // messages.push("We've got a user!")
      let userIdx = entries.indexOf(userIDStr + guildIDStr)
      if (userIdx) {
        // messages.push(`First instance is at: ${userIdx}`)
        let recordNumber = -1
        recordNumber = Math.ceil(userIdx / 192)
        if (recordNumber > 0) {
          recordNumber -= 1
          // messages.push(`User is at: ${recordNumber}!`)
          entries = entries.split("\n")
          // messages.push(entries[recordNumber])
          entries[recordNumber] = ""
          entries = entries.filter(item=>item.trim() != "")
          fs.writeFileSync(logFilePath, entries.join("\n"), "utf8")
          if (entries.length > 0) {
            fs.appendFileSync(logFilePath, "\n", "utf8")
          }
        }
      }
    }
  }

  // Search for existing user entry
  // Update existing entry if user is present
  // Append new entry if user not present
  fs.appendFileSync(logFilePath, logEntry.join("\n") + "\n", "utf8")

  return [result, messages]
}
