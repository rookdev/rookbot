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
    let logProps = {
      color: client.profile.colors.good,
      title: {
        text: "[Log] Member Joined",
        emoji: "👋"
      },
      players: {
        user: {
          name: newMember.guild.name,
          avatar: newMember.guild.iconURL( { size: 128 } )
        },
        target: {
          name: newMember.user.displayName,
          avatar: newMember.user.displayAvatarURL( { size: 128 } )
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
            name: "Member Link",
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
              newMember.guild.name,
              newMember.guild.id,
              { showID: true }
            )
          }
        ],
        [
          {
            name: "Member Role?",
            value: newMember.roles.cache.map(r => r.name).includes("Member")
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
      newMember.guild,
      "members",
      logProps
    )

    let logLines = [
      `User:  ${newMember.user.tag} (ID: ${newMember.user.id})`,
      `Guild: ${newMember.guild.name} (ID: ${newMember.guild.id})`
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
        guild: newMember.guild.name,
        member: newMember.user.tag,
        action: "join"
      }
    )
  }
}
