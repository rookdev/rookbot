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

const PingCommand = require('../../commands/diag/ping')
// Use Discord HammerTime
const timeFormat = require('../../utils/formatters/timeFormat')
const fileFuncs = require('../../utils/fs/fileFuncs')
const numFuncs = require('../../utils/primitives/numFuncs')
const moment = require('moment')
const fs = require('fs')      // Filesystem manipulation

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

  let emoji = ""

  const targetUserId = message.author.id
  let targetUser = null
  try {
    targetUser = await client.users.fetch(targetUserId)
  } catch(err) {
    console.log(`No user found for seener [${message.author.id}]`)
    return [result, messages]
  }

  // Get the guild member (to fetch nickname if present)
  let guildMember = null
  try {
    guildMember = await message.guild.members.fetch(targetUserId)
  } catch(err) {
    console.log(`No guild member found for seener [${message.author.id}]`)
    return [result, messages]
  }

  const user = guildMember?.user ?? targetUser

  let pretty_name = "Message_Stamp".split("_").map(x => x.ucfirst()).join(" ")

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

  // console.log(logEntry)

  let entries = fileFuncs.getAFile(logFilePath)
  if (entries) {
    // console.log("We've got entries!")
    if (entries.includes(userIDStr + guildIDStr)) {
      // console.log("We've got a user!")
      let userIdx = entries.indexOf(userIDStr + guildIDStr)
      if (userIdx) {
        // console.log(`First instance is at: ${userIdx}`)
        let recordNumber = -1
        recordNumber = Math.ceil(userIdx / 192)
        if (recordNumber > 0) {
          recordNumber -= 1
          // console.log(`User is at: ${recordNumber}!`)
          entries = entries.split("\n")
          // console.log(entries[recordNumber])
          entries[recordNumber] = ""
          entries = entries.filter(
            item => item.trim() != ""
          )
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
