// @ts-nocheck

// Formatters: userMention
const { userMention, inlineCode, codeBlock, ApplicationCommandOptionType, ChannelType, ActivityType, InviteType } = require('discord.js')
// AdminCommand
const { AdminCommand } = require('../../classes/command/admincommand.class')
const dbFuncs = require('../../utils/db/dbFuncs')
const moment = require('moment')

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// Multiple messages

/**
 * @class
 * @classdesc
 * @this {EmitCommand}
 * @extends {AdminCommand}
 * @public
 */
module.exports = class EmitCommand extends AdminCommand {
  constructor(client) {
    let comprops = {
      name: "emit",
      category: "admin",
      description: "Emit event",
      options: [
        {
          name: "event-name",
          description: "Event Name",
          type: ApplicationCommandOptionType.String,
          required: true
        }
      ]
    }
    let props = {
      title: {
        text:   "Emit Event"
      }
    }

    super(
      client,
      {...comprops},
      {...props}
    )
  }

  // declare props: import('../../types/embed').EmbedProps

  async action(client, interaction, coptions={}) {
    let eventName = coptions["event-name"]
    let args = []
    this.props.description = [
      inlineCode(eventName)
    ]

    let guild = await this.getProp(client, interaction, "guild")
    if (eventName == "channelCreate") {
      // channelCreate
      //  editVoiceChannel
      let voiceChannelNames = null
      // DB
      let dbRes = await dbFuncs.getDB(
        guild.id,
        "voiceChannelNames"
      )
      voiceChannelNames = dbRes[0]
      this.messages.push(...dbRes[1])
      // /DB

      let channel = {
        name: "Old Name",
        guild: { name: guild.name, id: guild.id },
        parentId: voiceChannelNames.categories[0],
        type: ChannelType.GuildVoice,
        edit: async () => { return true },
        isVoiceBased: () => { return true }
      }
      args.push(channel)

      channel.name = "New Name"
      args.push(channel)
    } else if (
      [
        "guildMemberAdd",
        "guildMemberRemove",
        "guildMemberUpdate"
      ].includes(eventName)
    ) {
      // guildMemberAdd
      //  logMemberJoin
      // guildMemberRemove
      //  logMemberLeave
      // guildMemberUpdate
      //  announceGoLive
      //  boostePraise
      //  logNameChange
      let oldMember = await guild.members.me
      if (!(oldMember?.presence)) {
        // console.log("Adding Member Presence")
        oldMember.presence = {}
      }
      if (!(oldMember?.presence?.activities)) {
        // console.log("Adding Member Presence Activities")
        oldMember.presence.activities = [
          {}
        ]
      }
      let oldMemberGuild = await this.getProp(client, oldMember, "guild")
      if (!(oldMemberGuild)) {
        // console.log("Adding Guild")
        oldMember.guild = guild
      }
      if (!(oldMemberGuild?.roles)) {
        // console.log("Adding Guild Roles")
        oldMember.guild.roles = {}
      }
      if (!(oldMemberGuild?.roles?.cache)) {
        // console.log("Adding Guild Roles Cache")
        oldMember.guild.roles.cache = {
          roles: [
            {
              name: "Server Booster",
              id: 1,
            }
          ],
          find: async () => {
            return {
              id: 0
            }
          }
        }        
      }
      if (!(oldMember?.roles)) {
        // console.log("Adding Member Roles")
        oldMember.roles = {}
      }
      if (!(oldMember?.roles?.cache)) {
        // console.log("Adding Member Roles Cache")
        oldMember.roles.cache = {
          moo: 1,
          has: () => { return false }
        }
      }
      args.push(oldMember)
      // console.log(oldMember)

      if (eventName == "guildMemberUpdate") {
        let newMember = JSON.parse(JSON.stringify(oldMember))
        newMember.guild = guild
        newMember.guild.roles.cache.find = async () => {
          return {
            id: 1
          }
        }
        newMember.roles.cache = {
          has: async (rID) => {
            return rID = 1
          }
        }

        if (!(newMember?.presence)) {
          // console.log("Adding Member Presence")
          newMember.presence = {}
        }
        if (!(newMember?.presence?.activities)) {
          // console.log("Adding Member Presence Activities")
          newMember.presence.activities = [
            {}
          ]
        }

        // console.log(newMember)

        // announceGoLive
        newMember.presence.activities[0] = { url: "http://example.com/stream" }

        // boosterPraise
        // logNameChange
        newMember.displayAvatarURL = async () => {
          return await guild.members.me.displayAvatarURL({ size: 128 })
        }
        newMember.nickname = "New Name"
        newMember.user = guild.members.me.user
        args.push(newMember)
      }
    } else if (eventName == "inviteCreate") {
      // inviteCreate
      //  logCreatedInvite
      let user = await this.getProp(client, interaction, "user")
      args.push(
        {
          channel: interaction.channel,
          channelId: interaction.channelId,
          code: "iddqd",
          createdAt: 0,
          expiresAt: 0,
          guild: guild,
          inviter: user,
          inviterId: user.id,
          maxAge: 0,
          maxUses: 0,
          memberCount: 0,
          presenceCount: 0,
          temporary: true,
          type: InviteType.Guild,
          url: "http://example.com/inviteURL",
          uses: 0
        }
      )
    } else if (
      [
        "messageReactionAdd",
        "messageReactionRemove"
      ].includes(eventName)
    ) {
      // messageReactionAdd
      // messageReactionRemove
      //  rr
      let reaction = {
        message: {
          guild: guild,
          id: interaction.id
        },
        emoji: {
          name: "✅"
        },
        me: true
      }
      let user = await guild.members.me

      args.push(reaction)
      args.push(user)
    } else if (eventName == "messageCreate") {
      let message = {
        content: "Content",
        guild: guild,
        channel: interaction.channel,
        url: "http://example.com/message",
        author: guild.members.me
      }
      // message.author.id = 0

      args.push(message)
    } else if (eventName == "messageDelete") {
      args.push(interaction)
    } else if (eventName == "messageUpdate") {
      let message = {
        content: "Old Content",
        guild: guild,
        channel: interaction.channel,
        url: "http://example.com/message",
        author: guild.members.me
      }
      // message.author.id = 0

      args.push(message)

      message.content = "New Content"
      args.push(message)
    } else if (eventName == "presenceUpdate") {
      let presence = {
        status: "online",
        guild: guild,
        userId: client.user.id,
        user: guild.members.me,
        activities: [
          {
            name: "Twitch",
            type: ActivityType.Streaming,
            url: "http://example.com/stream",
            details: "Details",
            state: "State",
            createdTimestamp: moment.utc().format("x")
          }
        ]
      }

      args.push(presence)

      // Wait a second after oldPresence
      await wait(1 * 1000)
      let newPresence = JSON.parse(JSON.stringify(presence))
      newPresence.guild = guild,
      newPresence.user = client.user
      newPresence.member = guild.members.me
      newPresence.activities[0].url = "http://example.com/stream2"
      newPresence.activities[0].createdTimestamp = moment.utc().format("x")
      args.push(newPresence)
    } else if (eventName == "voiceStateUpdate") {
      let voiceState = {
        streaming: false,
        channelId: interaction.channel.id,
        guild: guild,
        member: guild.members.me
      }

      args.push(voiceState)

      let newVoiceState = JSON.parse(JSON.stringify(voiceState))
      newVoiceState.streaming = true
      newVoiceState.guild = guild
      newVoiceState.member = guild.members.me
      args.push(newVoiceState)
    }

    await client.emit(eventName, ...args)

    if (![
      "inviteCreate",
      "guildMemberUpdate",
      "messageCreate",
      "messageDelete",
      "messageReactionAdd",
      "messageReactionRemove",
      "messageUpdate",
      "presenceUpdate",
      "voiceStateUpdate"
    ].includes(eventName)) {
      this.props.description.push(codeBlock(JSON.stringify(args)))
    }
  }
}
