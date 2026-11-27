// @ts-nocheck

const { GuildMember, InviteType, hyperlink, Invite, codeBlock } = require('discord.js')
const { EventScript } = require('../../classes/event/eventscript.class')
const { RookClient } = require('../../classes/objects/rclient.class')
const mentionFuncs = require('../../utils/formatters/mentions')
const timeFormat = require('../../utils/formatters/timeFormat')
const moment = require('moment')

/**
 * @class
 * @this {LogDeletedInviteEvent}
 * @public
 */
module.exports = class LogDeletedInviteEvent extends EventScript {
  constructor(client) {
    let evtprops = {
      name: "logDeletedInvite",
      event: "inviteCreate",
      label: "Invite Deleted",
      description: "Log to a channel and to disk when an invite is deleted"
    }
    super(
      client,
      {...evtprops}
    )
  }

  /**
   * 
   * @param {RookClient} client 
   * @param {Invite} oldInvite 
   * @returns 
   */
  async action(client, oldInvite) {
    // this.messages.push(`/${this.name}: Event Action`)
    let guild = await this.getProp(client, oldInvite, "guild")

    if (guild) {
      // Normal Invites
      let newInvites = await guild
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
    }

    let createdDateTime = null
    let expiresDateTime = null
    let logProps = {}
    logProps.color = client.profile.colors.bad
    logProps.title = {
      text: "[Log] Invite Deleted",
      emoji: client.profile.emojis.delete + "✉️"
    }
    logProps.entities = {
      target: {
        name: guild.name,
        avatar: await guild.iconURL( { size: 128 })
      }
    }
    if (oldInvite.inviter) {
      logProps.entities.user = {
        name: oldInvite.inviter.displayName,
        avatar: await oldInvite.inviter.displayAvatarURL( { size: 128 } )
      }
    }
    logProps.playerTypes = {
      user: "user",
      target: "target"
    }

    logProps.fields = []
    // Fields
    // Expires At
    // logProps.fields.push(
    //   [
    //     {
    //       name: "Expires At",
    //       value: expiresDateTime
    //         ? timeFormat(
    //             expiresDateTime.format("x"),
    //             { with: "relative" }
    //           )
    //         : 'Unknown'
    //     }
    //   ]
    // )
    // Created At
    // logProps.fields.push(
    //   [
    //     {
    //       name: "Created At",
    //       value: createdDateTime
    //         ? timeFormat(
    //             createdDateTime.format("x"),
    //             { with: "relative" }
    //           )
    //         : 'Unknown'
    //     }
    //   ]
    // )

    // Inviter Link
    if (oldInvite.inviter) {
      logProps.fields.push(
        [
          {
            name: "Inviter Link",
            value: hyperlink(
              oldInvite.inviter.tag,
              `https://discord.com/users/${oldInvite.inviter.id}`
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
              oldInvite.inviter.id,
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
            oldInvite.channelId,
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
          value: codeBlock(oldInvite.code)
        }
      ]
    )
    // Type
    logProps.fields.push(
      [
        {
          name: "Type",
          value: InviteType[oldInvite.type]
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
          value: oldInvite.maxAge
        },
        {
          name: "Max Uses",
          value: oldInvite.maxUses
        },
        {
          name: "Used Uses",
          value: oldInvite.uses
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
          value: oldInvite.memberCount
        },
        {
          name: "Presence Count",
          value: oldInvite.presenceCount
        },
        {
          name: "Temp Membership",
          value: oldInvite.temporary
            ? client.profile.emojis[
              (
                (
                  oldInvite.temporary
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
    if (oldInvite.inviter) {
      logLines.push(
        `User:     ${oldInvite.inviter.tag} (ID: ${oldInvite.inviter.id})`
      )
    }

    logLines.push(`Guild:    ${guild.name} (ID: ${guild.id})`)
    logLines.push(`Channel:  ${oldInvite.channel.name} (ID: ${oldInvite.channel.id})`)
    logLines.push(`Expires:  ${expiresDateTime}`)
    logLines.push(`Code:     ${oldInvite.code}`)
    logLines.push(`Max Age:  ${oldInvite.maxAge}`)
    logLines.push(`Max Uses: ${oldInvite.maxUses}`)
    logLines.push(`Type:     ${InviteType[oldInvite.type]}`)
    // client
    // data
    // <region><this>.log
    // await this.logFile(
    //   client,
    //   logLines,
    //   "invites"
    // )

    // appended messages for debugging
    await this.logMessages(
      client.profile.emojis.delete + "✉️",
      {
        guild: guild.name,
        member: oldInvite?.inviter?.tag,
        // expires: expiresDateTime,
        channel: oldInvite.channel.name,
        code: oldInvite.code,
        type: InviteType[oldInvite.type],
        action: "deleted"
      }
    )
  }
}
