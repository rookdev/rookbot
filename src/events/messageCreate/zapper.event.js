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
  userMention,
  hyperlink
} = require('discord.js')

const { EventScript } = require('../../classes/event/eventscript.class')
const mentionFuncs = require('../../utils/formatters/mentions')
const BanCommand = require('../../commands/mod/ban')
// Use Discord HammerTime
const timeFormat = require('../../utils/formatters/timeFormat')
const fileFuncs = require('../../utils/fs/fileFuncs')
const numFuncs = require('../../utils/primitives/numFuncs')
const dbFuncs = require('../../utils/db/dbFuncs')
const getters = require('../../utils/guild/getters')
const moment = require('moment')
const fs = require('fs')      // Filesystem manipulation

module.exports = class ZapperEvent extends EventScript {
  constructor(client) {
    let evtprops = {
      name: "zapper",
      event: "messageCreate",
      label: "Zapper",
      description: "Bans a user that posts in the zapper"
    }
    super(
      client,
      {...evtprops}
    )
  }

  async action(client, message) {
    // this.messages.push(`/${this.name}: Event Action`)
    // Reasons to bail
    // If no message
    if (! message) {
      // this.messages.push("No Message")
      return false
    }
    // If no guild
    if (! message.guild) {
      // this.messages.push("No Guild")
      return false
    }
    // If no channel
    if (! message.channel) {
      // this.messages.push("No Channel")
      return false
    }

    // Get BanCommand Command Object
    let banCmd = new BanCommand(client)
    let messageGuild = await this.getGuild(client, message)
    let zapChannel = await getters.getCachedChannel(client, messageGuild, [ "zapper" ])
    // If no Zap Channel defined
    if (! zapChannel) {
      // this.messages.push("No Zap Channel defined")
      return false
    }
    // If it's not the zapper channel
    if (message.channel.id != zapChannel?.id) {
      // this.messages.push(`Not Zapper Channel [Msg: ${message.channel.name}/${message.channel.id}; Zapper: ${zapChannel?.id}]`)
      return false
    }
    // If it's the bot
    if (message.author.id == client.user.id) {
      // this.messages.push("It's the Bot")
      return false
    }

    let emoji = ""

    const targetUserId = message.author.id
    const targetUser = await getters.getCachedUser(targetUserId)

    // Get the guild member (to fetch nickname if present)
    const guildMember = await getters.getCachedMember(client, messageGuild, targetUserId)
    const user = guildMember?.user ?? targetUser

    // Get list of roles
    let ROLES = null
    let dbRes = await dbFuncs.getDB(
      message.guild.id,
      "roles"
    )
    ROLES = dbRes[0]
    this.messages.push(...dbRes[1])
    
    // If it's an admin or mod
    if (
      ROLES &&
      (
        (ROLES.length > 0) ||
        (Object.keys(ROLES).length > 0)
      ) &&
      // true
      false
    ) {
      // Get Mod roles
      let APPROVED_ROLES = ROLES["admin"].concat(ROLES["mod"])

      // Bail if we don't have intended Approved Roles data
      if (!APPROVED_ROLES) {
        // this.messages.push("Couldn't get Roles List")
        // do nothing
      }

      // Bail if member does have Approved Roles
      if(
        await guildMember.roles.cache.some(
          r => APPROVED_ROLES.includes(r.name)
        )
      ) {
        // this.messages.push("It's an Admin or Mod")
        return false
      }
    }

    let joinedDateTime = moment.utc(guildMember.joinedTimestamp)
    let createdDateTime = moment.utc(guildMember.user.createdTimestamp)
    let now = moment.utc()
    let logFields = [
      [
        {
          name: 'Zapped At',
          value: timeFormat(
            now.format("x"),
            { with: "relative" }
          )
        },
        {
          name: "Joined At",
          value: joinedDateTime
            ? timeFormat(
                joinedDateTime.format("x"),
                { with: "relative" }
              )
            : 'Unknown'
        }
      ],
      [
        {
          name: "Created At",
          value: createdDateTime
            ? timeFormat(
                createdDateTime.format("x"),
                { with: "relative" }
              )
            : 'Unknown'
        }
      ],
      [
        {
          name: "Member Zapped",
          value: hyperlink(
            guildMember.user.tag,
            `https://discord.com/users/${guildMember.user.id}`
          )
        }
      ],
      [
        {
          name: "Member Mention",
          value: mentionFuncs.userMention(
            guildMember.user.id,
            { showID: true }
          )
        }
      ],
      [
        {
          name: "Guild",
          value: mentionFuncs.guildMention(
            guildMember.guild.name,
            guildMember.guild.id,
            { showID: true }
          )
        }
      ],
      [
        {
          name: "Member Role?",
          value: await guildMember.roles.cache.map(r=>r.name).includes("Member")
            ? client.profile.emojis.check
            : client.profile.emojis.nocheck
        }
      ]
    ]
    let logProps = {
      color: client.profile.colors.bad,
      title: {
        text: "[Log] Bot Trap",
        emoji: "⚡"
      },
      players: {
        user: {
          name: message.guild.members.me.name,
          avatar: message.guild.members.me.displayAvatarURL({ size: 128 })
        },
        target: {
          name: guildMember.user.displayName,
          avatar: guildMember.user.displayAvatarURL({ size: 128 })
        }
      },
      fields: logFields
    }

    // client
    // guild
    // logging-<this> guildchannel key
    // embed props
    await this.logPost(
      client,
      guildMember.guild,
      "zapper",
      logProps
    )

    // Build BanCommand Command Object
    banCmd.null = true
    let banResult = await banCmd.build(
      client,
      message,
      {
        'target-id': targetUserId,
        'reason': "Posted in zapper",
        'bypass': true
      },
      true
    )

    this.messages.push(
      "⚡ " +
      JSON.stringify(
        {
          guild: message.guild.name,
          member: message.author.tag,
          action: "zap",
          channel: message.channel.name,
          message: message.id
        }
      )
    )

    message.delete()

    return true
  }
}
