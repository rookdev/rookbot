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

const BanCommand = require('../../commands/mod/ban')
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

  // Get BanCommand Command Object
  let banCmd = new BanCommand(client)
  let zapChannel = await banCmd.getChannel(client, message, [ "zapper" ])
  // If no Zap Channel defined
  if (! zapChannel) {
    // console.log("No Zap Channel defined")
    return [result, messages]
  }
  // If it's not the zapper channel
  if (message.channel.id != zapChannel?.id) {
    // console.log(`Not Zapper Channel [Msg: ${message.channel.name}/${message.channel.id}; Zapper: ${zapChannel?.id}]`)
    return [result, messages]
  }
  // If it's the bot
  if (message.author.id == client.user.id) {
    // console.log("It's the Bot")
    return [result, messages]
  }

  let emoji = ""

  const targetUserId = message.author.id
  const targetUser = await client.users.fetch(targetUserId)

  // Get the guild member (to fetch nickname if present)
  const guildMember = await message.guild.members.fetch(targetUserId)
  const user = guildMember?.user ?? targetUser

  // Get list of roles
  let ROLES = fileFuncs.getAFile(
    [
      "src",
      "dbs",
      message.guild.id
    ],
    "roles.json"
  )
 
  // If it's an admin or mod
  if (
    ROLES &&
    (
      (ROLES.length > 0) ||
      (Object.keys(ROLES).length > 0)
    )
  ) {
    // Get Mod roles
    let APPROVED_ROLES = ROLES["admin"].concat(ROLES["mod"])

    // Bail if we don't have intended Approved Roles data
    if (!APPROVED_ROLES) {
      // console.log("Couldn't get Roles List")
      // do nothing
    }

    // Bail if member does have Approved Roles
    if(
      await guildMember.roles.cache.some(
        r => APPROVED_ROLES.includes(r.name)
      )
    ) {
      // console.log("It's an Admin or Mod")
      return [result, messages]
    }
  }

  // Check Editable
  let editable = banCmd.botCanEdit(client, guildMember)

  /**
   * Region that this is being sent to
   *  Development
   *  Production; also sends to Discord Audit Log
   */
  let region = ((!banCmd.DEV) ? "Production" : "Development")

  const logsChannel = await banCmd.getChannel(client, message, [ `logging-zapper`, "logging" ])
  if (logsChannel) {
    if (banCmd.DEV) {
      emoji = "[DEV]" + emoji
    }

    let logFields = []
    let now = moment.utc()
    logFields.push(
      [
        {
          name: 'Time',
          value: timeFormat(now.format("x"), { with: "relative" })
        }
      ],
      [
        {
          name: 'User ' + "Banned",
          value: [
            targetUser,
            `[${inlineCode(targetUserId)}]`
          ]
        }
      ]
    )
  }

  banCmd.null = true
  // Build BanCommand Command Object
  result = await banCmd.build(
    client,
    message,
    {
      'target-id': targetUserId,
      'reason': "Posted in zapper"
    }
  )

  message.delete()

  return [result, messages]
}
