// @ts-nocheck

const { GuildMember, InviteType, hyperlink, Invite, codeBlock } = require('discord.js')
const { EventScript } = require('../../classes/event/eventscript.class')
const { RookClient } = require('../../classes/objects/rclient.class')
const mentionFuncs = require('../../utils/formatters/mentions')
const timeFormat = require('../../utils/formatters/timeFormat')
const moment = require('moment')

/**
 * @class
 * @this {LogCreatedInviteEvent}
 * @public
 */
module.exports = class LogCreatedInviteEvent extends EventScript {
  constructor(client) {
    let evtprops = {
      name: "logCreatedInvite",
      event: "inviteCreate",
      label: "Invite Created",
      description: "Log to a channel and to disk when an invite is created"
    }
    super(
      client,
      {...evtprops}
    )
  }

  /**
   * 
   * @param {RookClient} client 
   * @param {Invite} newInvite 
   * @returns 
   */
  async action(client, newInvite) {
    // this.messages.push(`/${this.name}: Event Action`)
    let guild = await this.getProp(client, newInvite, "guild")
    let createdDateTime = moment.utc(newInvite.createdTimestamp)
    let expiresDateTime = newInvite.expiresTimestamp ? moment.utc(newInvite.expiresTimestamp) : null
    let logProps = {
      title: {
        text: "[Log] Invite Created",
        emoji: "✉️"
      },
      players: {
        user: {
          name: guild.name,
          avatar: await guild.iconURL( { size: 128 } )
        },
        target: {
          name: newInvite.inviter.displayName,
          avatar: await newInvite.inviter.displayAvatarURL( { size: 128 } )
        }
      },
      fields: [
        [
          {
            name: "Expires At",
            value: expiresDateTime
              ? timeFormat(
                  expiresDateTime.format("x"),
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
            name: "Inviter Link",
            value: hyperlink(
              newInvite.inviter.tag,
              `https://discord.com/users/${newInvite.inviter.id}`
            )
          }
        ],
        [
          {
            name: "Inviter Mention",
            value: mentionFuncs.userMention(
              newInvite.inviter.id,
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
            name: "Channel",
            value: mentionFuncs.channelMention(
              newInvite.channelId,
              { showID: true }
            )
          }
        ],
        [
          {
            name: "Code",
            value: codeBlock(newInvite.code)
          }
        ],
        [
          {
            name: "Type",
            value: InviteType[newInvite.type]
          }
        ]
        [
          {
            name: "Max Age",
            value: newInvite.maxAge
          },
          {
            name: "Max Uses",
            value: newInvite.maxUses
          },
          {
            name: "Used Uses",
            value: newInvite.uses
          }
        ],
        [
          {
            name: "Member Count",
            value: newInvite.memberCount
          },
          {
            name: "Presence Count",
            value: newInvite.presenceCount
          },
          {
            name: "Temp Membership",
            value: newInvite.temporary
              ? client.profile.emojis[
                (
                  (
                    newInvite.temporary
                      ? ""
                      : "no"
                  )
                  + "check"
                )
              ]
              : ""
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
      "invites",
      logProps
    )

    let logLines = [
      `User:     ${newInvite.inviter.tag} (ID: ${newInvite.inviter.id})`,
      `Guild:    ${guild.name} (ID: ${guild.id})`,
      `Channel:  ${newInvite.channel.name} (ID: ${newInvite.channel.id})`,
      `Expires:  ${expiresDateTime}`,
      `Code:     ${newInvite.code}`,
      `Max Age:  ${newInvite.maxAge}`,
      `Max Uses: ${newInvite.maxUses}`,
      `Type:     ${InviteType[newInvite.type]}`
    ]
    // client
    // data
    // <region><this>.log
    await this.logFile(
      client,
      logLines,
      "invites"
    )

    // appended messages for debugging
    await this.logMessages(
      "✉️",
      {
        guild: guild.name,
        member: newInvite.inviter.tag,
        expires: expiresDateTime,
        channel: newInvite.channel.name,
        code: newInvite.code,
        type: InviteType[newInvite.type],
        action: "created"
      }
    )
  }
}
