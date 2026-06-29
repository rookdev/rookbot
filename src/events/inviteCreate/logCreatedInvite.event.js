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
    let logProps = {}
    logProps.color = client.profile.colors.info
    logProps.title = {
      text: "[Log] Invite Created",
      emoji: "✉️"
    }
    logProps.entities = {
      target: {
        name: guild.name,
        avatar: await guild.iconURL( { size: 128 })
      }
    }
    if (newInvite.inviter) {
      logProps.entities.user = {
        name: newInvite.inviter.displayName,
        avatar: await newInvite.inviter.displayAvatarURL( { size: 128 } )
      }
    }
    logProps.playerTypes = {
      user: "user",
      target: "target"
    }

    // Fields
    // Expires At
    logProps.fields.push(
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
      ]
    )
    // Created At
    logProps.fields.push(
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
      ]
    )

    // Inviter Link
    if (newInvite.inviter) {
      logProps.fields.push(
        [
          {
            name: "Inviter Link",
            value: hyperlink(
              newInvite.inviter.tag,
              `https://discord.com/users/${newInvite.inviter.id}`
            )
          }
        ]
      )
      // Inviter Mention
      logProps.fields.push(
        [
          {
            name: "Inviter Mention",
            value: mentionFuncs.userMention(
              newInvite.inviter.id,
              { showID: true }
            )
          }
        ]
      )
    }

    // Guild
    logProps.fields.push(
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
    )
    // Channel
    logProps.fields.push(
      [
        {
          name: "Channel",
          value: mentionFuncs.channelMention(
            newInvite.channelId,
            { showID: true }
          )
        }
      ]
    )
    // Code
    logProps.fields.push(
      [
        {
          name: "Code",
          value: codeBlock(newInvite.code)
        }
      ]
    )
    // Type
    logProps.fields.push(
      [
        {
          name: "Type",
          value: InviteType[newInvite.type]
        }
      ]
    )
    // Max Age
    // Max Uses
    // Used Uses
    logProps.fields.push(
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
      ]
    )
    // Member Count
    // Presence Count
    // Temp Membership
    logProps.fields.push(
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
    )

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

    let logLines = []
    if (newInvite.inviter) {
      logLines.push(
        `User:     ${newInvite.inviter.tag} (ID: ${newInvite.inviter.id})`
      )
    }

    logLines.push(`Guild:    ${guild.name} (ID: ${guild.id})`)
    logLines.push(`Channel:  ${newInvite.channel.name} (ID: ${newInvite.channel.id})`)
    logLines.push(`Expires:  ${expiresDateTime}`)
    logLines.push(`Code:     ${newInvite.code}`)
    logLines.push(`Max Age:  ${newInvite.maxAge}`)
    logLines.push(`Max Uses: ${newInvite.maxUses}`)
    logLines.push(`Type:     ${InviteType[newInvite.type]}`)
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
        member: newInvite?.inviter?.tag,
        expires: expiresDateTime,
        channel: newInvite.channel.name,
        code: newInvite.code,
        type: InviteType[newInvite.type],
        action: "created"
      }
    )
  }
}
