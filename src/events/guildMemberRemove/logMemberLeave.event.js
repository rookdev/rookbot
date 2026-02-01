// @ts-nocheck

const { GuildMember, hyperlink } = require('discord.js')
const { EventScript } = require('../../classes/event/eventscript.class')
const { RookClient } = require('../../classes/objects/rclient.class')
const timeConversion = require('../../utils/formatters/timeConversion')
const mentionFuncs = require('../../utils/formatters/mentions')
const timeFormat = require('../../utils/formatters/timeFormat')
const moment = require('moment')

/**
 * @class
 * @this {LogMemberLeaveEvent}
 * @public
 */
module.exports = class LogMemberLeaveEvent extends EventScript {
  constructor(client) {
    let evtprops = {
      name: "logMemberLeave",
      event: "guildMemberRemove",
      label: "Member Left",
      description: "Log to a channel and to disk when a member leaves"
    }
    super(
      client,
      {...evtprops}
    )
  }

  /**
   * 
   * @param {RookClient} client 
   * @param {GuildMember} oldMember 
   * @returns 
   */
  async action(client, oldMember) {
    // this.messages.push(`/${this.name}: Event Action`)
    let leftDateTime = moment.utc()
    let joinedDateTime = moment.utc(oldMember.joinedTimestamp)
    let createdDateTime = moment.utc(oldMember.user.createdTimestamp)
    let durationStr = timeConversion(
      moment.duration(
        Math.abs(
          joinedDateTime.diff(
            leftDateTime
          )
        )
      )
    )

    let logProps = {
      color: client.profile.colors.bad,
      title: {
        text: "[Log] Member Left",
        emoji: "🚶‍♂️🚪"
      },
      players: {
        user: {
          name: oldMember.guild.name,
          avatar: oldMember.guild.iconURL( { size: 128 } )
        },
        target: {
          name: oldMember.user.displayName,
          avatar: oldMember.user.displayAvatarURL( { size: 128 } )
        }
      },
      fields: [
        [
          {
            name: "Left At",
            value: leftDateTime
              ? timeFormat(
                  leftDateTime.format("x"),
                  { with: "relative" }
                )
              : 'Unknown'
          }
        ],
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
            name: "Lasted For",
            value: durationStr
              ? durationStr
              : 'Unknown'
          }
        ],
        [
          {
            name: "Member Left",
            value: hyperlink(
              oldMember.user.tag,
              `https://discord.com/users/${oldMember.user.id}`
            )
          }
        ],
        [
          {
            name: "Member Link",
            value: mentionFuncs.userMention(
              oldMember.user.id,
              { showID: true }
            )
          }
        ],
        [
          {
            name: "Guild",
            value: mentionFuncs.guildMention(
              oldMember.guild.name,
              oldMember.guild.id,
              { showID: true }
            )
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
      oldMember.guild,
      "members",
      logProps
    )

    let logLines = [
      `User:  ${oldMember.user.tag} (ID: ${oldMember.user.id})`,
      `Guild: ${oldMember.guild.name} (ID: ${oldMember.guild.id})`
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
      "🚪",
      {
        guild: oldMember.guild.name,
        member: oldMember.user.tag,
        action: "leave",
        duration: durationStr
      }
    )
  }
}
