// @ts-nocheck

const { AuditLogEvent, GuildMember, inlineCode, hyperlink } = require('discord.js')
const { EventScript } = require('../../classes/event/eventscript.class')
const { RookClient } = require('../../classes/objects/rclient.class')
const mentionFuncs = require('../../utils/formatters/mentions')
const timeFormat = require('../../utils/formatters/timeFormat')
const moment = require('moment')

/**
 * @class
 * @this {LogMemberJoinEvent}
 * @public
 */
module.exports = class LogMemberJoinEvent extends EventScript {
  constructor(client) {
    let evtprops = {
      name: "logMemberJoin",
      event: "guildMemberAdd",
      label: "Member Joined",
      description: "Log to a channel and to disk when a member joins"
    }
    super(
      client,
      {...evtprops}
    )
  }

  /**
   * 
   * @param {RookClient} client 
   * @param {GuildMember} newMember 
   * @returns 
   */
  async action(client, newMember) {
    // this.messages.push(`/${this.name}: Event Action`)

    let joinedDateTime  = moment.utc(newMember.joinedTimestamp)
    let createdDateTime = moment.utc(newMember.user.createdTimestamp)
    let guild           = await this.getProp(client, newMember, "guild")
    let usedInvite      = null

    if (newMember?.user?.bot) {
      let auditLogs = await newMember.guild
        .fetchAuditLogs({ type: AuditLogEvent.BotAdd })
      let latestLog = auditLogs.entries.first()

      let target = null
      target = latestLog?.target
      if (target?.partial) {
        target = await target.fetch()
      }

      if (newMember?.id === target?.id) {
        let inviter = null
        inviter = latestLog?.executor
        if (inviter?.partial) {
          inviter = await inviter.fetch()
        }
  
        usedInvite = {
          guildName: guild.name,
          inviter
        }
      }
    }

    if (
      [
        "1461755413270626560" // Rookbot Sandbox
      ].includes(guild.id)
    ) {
      let vanityInvites = client.invites?.vanity?.get(guild.id)
      if (vanityInvites) {
        if (Object.keys(vanityInvites).length > 0) {
          let newVanity = await guild.fetchVanityData()
          if (newVanity) {
            newVanity = {
              code: newVanity.code,
              uses: newVanity.uses
            }
            client.invites.vanity.set(guild.id, newVanity)

            let existingVanity = vanityInvites[Object.keys(vanityInvites)[0]]
            if (existingVanity.uses < newVanity.uses) {
              usedInvite = {
                guildName: guild.name,
                code: newVanity.code,
                inviter: await this.getCache(client, guild, "members", guild.ownerId),
                uses: newVanity.uses
              }
            }
          }
        }
      }
      if (!usedInvite) {
        let cachedInvites = client.invites.normal.get(guild.id)
        let newInvites    = await guild
          .invites
          .fetch()
        newInvites = newInvites
          .valueOf()
          .map(i => {
            return {
              guildName: guild.name,
              code: i.code,
              channelName: i.channel.name,
              inviter: i.inviter,
              maxUses: i.maxUses,
              uses: i.uses
            }
          }
        )
        // this.messages.push(`New Invites: ${JSON.stringify(newInvites)}`)
  
        if (cachedInvites) {
          let cachedInvitesHash = cachedInvites
          // this.messages.push(`Cached Invites: ${JSON.stringify(cachedInvitesHash)}`)
        }
        if (newInvites) {
          let newInvitesHash = {}
          for (let newInvite of newInvites) {
            // this.messages.push(`New Invite: ${JSON.stringify(newInvite)}`)
            newInvitesHash[newInvite.code] = {
              guildName: guild.name,
              code: newInvite.code,
              channelName: await newInvite?.channel?.name,
              inviter: newInvite.inviter,
              maxUses: newInvite.maxUses,
              uses: newInvite.uses
            }
          }
          // this.messages.push(`New Invites Hash: ${JSON.stringify(newInvitesHash)}`)
          client.invites.normal.set(guild.id, newInvitesHash)
        }
        if (cachedInvites && newInvites && !usedInvite) {
          usedInvite = newInvites.find(
            invite =>
              cachedInvites[invite.code].uses < invite.uses
          )
          if (!usedInvite) {
            usedInvite = {
              guildName: guild.name,
              code: "snafubarmoozippers",
              channelName: "bot-testing",
              inviter: "",
              maxUses: 100,
              uses: 1
            }
          }
          let usedInviteHash = {}
          usedInviteHash[usedInvite.code] = usedInvite.uses
          this.messages.push(`Used Invite: ${JSON.stringify(usedInviteHash)}`)
        }
      }
    }

    let logProps = {
      color: client.profile.colors.good,
      title: {
        text: "[Log] Member Joined",
        emoji: "👋"
      },
      entities: {
        guild: {
          name: guild.name,
          avatar: await guild.iconURL({ size: 128 })
        },
        target: {
          name: newMember.user.displayName,
          avatar: await newMember.user.displayAvatarURL( { size: 128 } )
        }
      },
      playerTypes: {
        user: "guild",
        target: "target"
      },
      fields: [
        [
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
            name: "Member Joined",
            value: hyperlink(
              newMember.user.tag,
              `https://discord.com/users/${newMember.user.id}`
            )
          }
        ],
        [
          {
            name: "Member Mention",
            value: mentionFuncs.userMention(
              newMember.user.id,
              { showID: true }
            )
          }
        ],
        [
          {
            name: "Guild",
            value: mentionFuncs.guildMention(
              guild.name,
              guild.id,
              { showID: true }
            )
          }
        ]
      ]
    }

    if (usedInvite) {
      let inviteUses = ""
      if (usedInvite?.uses) {
        inviteUses += usedInvite.uses
      }
      if (usedInvite?.maxUses) {
        inviteUses += '/' + usedInvite.maxUses
      }
      logProps.fields.push(
        [
          {
            name: "Invite Used",
            value: usedInvite?.code ? hyperlink(inlineCode(usedInvite.code), `http://discord.gg/${usedInvite.code}`) : ""
          },
          {
            name: "Invite Uses",
            value: inviteUses
          },
          {
            name: "Inviter",
            value: ((usedInvite?.inviter && (usedInvite.inviter != "")) ? mentionFuncs.userMention(usedInvite.inviter.id) : "")
          }
        ]
      )
    }

    // client
    // guild
    // logging-<this> guildchannel key
    // embed props
    await this.logPost(
      client,
      guild,
      "members",
      logProps
    )

    let logLines = [
      `User:  ${newMember.user.tag} (ID: ${newMember.user.id})`,
      `Guild: ${guild.name} (ID: ${guild.id})`
    ]
    // client
    // data
    // <region><this>.log
    await this.logFile(
      client,
      logLines,
      "memberChanges"
    )

    // appended messages for debugging
    await this.logMessages(
      "👋",
      {
        guild: guild.name,
        member: newMember.user.tag,
        invite: usedInvite?.code,
        inviter: usedInvite?.inviter ? usedInvite.inviter.tag : "",
        action: "join"
      }
    )
  }
}
