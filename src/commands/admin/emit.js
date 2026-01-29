// @ts-nocheck

// Formatters: userMention
const { userMention, ApplicationCommandOptionType, ChannelType, ActivityType, InviteType } = require('discord.js')
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
    let messages = []
    let eventName = coptions["event-name"]
    let args = []

    if (eventName == "channelCreate") {
      // channelCreate
      //  editVoiceChannel
      let voiceChannelNames = null
      // DB
      let dbRes = await dbFuncs.getDB(
        interaction.guild.id,
        "voiceChannelNames"
      )
      voiceChannelNames = dbRes[0]
      let newMessages = dbRes[1]
      messages = messages.concat(newMessages)
      // /DB

      let channel = {
        name: "Old Name",
        guild: { name: interaction.guild.name, id: interaction.guild.id },
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
      let member = await interaction.guild.members.me
      args.push(member)

      if (eventName == "guildMemberUpdate") {
        member.presence.activities.push(
          {
            url: "http://example.com/stream"
          }
        )
        member.nickname = "New Name"
        args.push(member)
      }
    } else if (eventName == "inviteCreate") {
      // inviteCreate
      //  logCreatedInvite
      args.push(
        {
          channelId: interaction.channelId,
          code: "iddqd",
          createdAt: 0,
          expiresAt: 0,
          guild: interaction.guild,
          inviterId: interaction.user.id,
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
          guild: interaction.guild,
          id: interaction.id
        },
        emoji: {
          name: "✅"
        },
        me: true
      }
      let user = await interaction.guild.members.me

      args.push(reaction)
      args.push(user)
    } else if (eventName == "messageCreate") {
      let message = {
        content: "Content",
        guild: interaction.guild,
        channel: interaction.channel,
        url: "http://example.com/message",
        author: interaction.guild.members.me
      }
      // message.author.id = 0

      args.push(message)
    } else if (eventName == "messageUpdate") {
      let message = {
        content: "Old Content",
        guild: interaction.guild,
        channel: interaction.channel,
        url: "http://example.com/message",
        author: interaction.guild.members.me
      }
      // message.author.id = 0

      args.push(message)

      message.content = "New Content"
      args.push(message)
    } else if (eventName == "presenceUpdate") {
      let presence = {
        status: "online",
        guild: interaction.guild,
        userId: client.user.id,
        user: interaction.guild.members.me,
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
      presence.activities[0].url = "http://example.com/stream2"
      presence.activities[0].createdTimestamp = moment.utc().format("x")
      args.push(presence)
    } else if (eventName == "voiceStateUpdate") {
      let voiceState = {
        streaming: false,
        channelId: interaction.channel.id,
        guild: interaction.guild,
        member: interaction.guild.members.me
      }

      args.push(voiceState)

      voiceState.streaming = true
      args.push(voiceState)
    }

    client.emit(eventName, ...args)
  }
}
