// @ts-nocheck

const { GuildMember, hyperlink } = require('discord.js')
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
    let joinedDateTime = moment.utc(newMember.joinedTimestamp)
    let createdDateTime = moment.utc(newMember.user.createdTimestamp)
    let guild = await this.getProp(client, newMember, "guild")
    let logProps = {
      color: client.profile.colors.good,
      title: {
        text: "[Log] Member Joined",
        emoji: "👋"
      },
      players: {
        user: {
          name: guild.name,
          avatar: await guild.iconURL( { size: 128 } )
        },
        target: {
          name: newMember.user.displayName,
          avatar: await newMember.user.displayAvatarURL( { size: 128 } )
        }
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
        ],
        [
          {
            name: "Member Role?",
            value: await newMember.roles.cache.map(r=>r.name).includes("Member")
              ? client.profile.emojis.check
              : client.profile.emojis.nocheck
          }
        ]
      ]
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
        action: "join"
      }
    )
  }
}
