// @ts-nocheck

const { GuildMember, hyperlink, AuditLogEvent } = require('discord.js')
const { EventScript } = require('../../classes/event/eventscript.class')
const { RookClient } = require('../../classes/objects/rclient.class')
const timeConversion = require('../../utils/formatters/timeConversion')
const mentionFuncs = require('../../utils/formatters/mentions')
const timeFormat = require('../../utils/formatters/timeFormat')
const moment = require('moment')
const { filesystem } = require('locutus/php')

/**
 * @class
 * @this {LogNameChangeEvent}
 * @public
 */
module.exports = class LogNameChangeEvent extends EventScript {
  constructor(client) {
    let evtprops = {
      name: "logNameChange",
      event: "guildMemberUpdate",
      label: "Name Change",
      description: "Log to a channel and to disk when a member gets a new nickname"
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
   * @param {GuildMember} newMember 
   * @returns 
   */
  async action(client, oldMember, newMember) {
    // this.messages.push(`/${this.name}: Event Action`)

    if (oldMember.nickname === newMember.nickname) {
      // this.messages.push(`${client.profile.emojis.warning} No nickname change detected for ${mentionFuncs.userMention(newMember.user.id, { showID: true, oneLine: true, textOnly: true })}`)
      return
    }

    let guild = await this.getProp(client, oldMember, "guild")

    if (!guild) {
      this.messages.push(`${client.profile.emojis.fail} GuildMemberUpdate occurred outside of a guild for ${mentionFuncs.userMention(newMember.user.id, { showID: true, oneLine: true, textOnly: true })}`)
      return
    }

    const fetchedLogs = await guild.fetchAuditLogs(
      {
        limit: 6,
        type: AuditLogEvent.MemberUpdate
      }
    ).catch(console.error)
    const auditEntry = await fetchedLogs.entries.find(
      a =>
        a.target.id === newMember.id &&
        Date.now() - a.createdTimestamp < (20 * 1000)
    )
    let auditMoment = moment.utc()
    if (auditEntry) {
      auditMoment = moment.utc(auditEntry.createTimestamp)
    }
    let updater = auditEntry?.executor ?? null
    if (updater) {
      let updaterMember = await this.getCache(client, guild, "members", updater.id)
      if (updaterMember) {
        updater = updaterMember
      }
    }

    let oldNick = oldMember.nickname ?? "No nickname"
    let newNick = newMember.nickname ?? newMember.user.displayName

    let logFields = []
    let logPlayers = {
      target: {
        name: newMember.displayName,
        avatar: await newMember.displayAvatarURL({ size: 128 })
      }
    }

    if (auditMoment) {
      logFields.push(
        [
          {
            name: "Edited At",
            value: auditMoment
              ? timeFormat(auditMoment.format("x"), { with: "relative" })
              : "Unknown"
          }
        ]
      )
    }
    logFields.push(
      [
        {
          name: "User",
          value: mentionFuncs.userMention(
            newMember.user.id,
            { showID: true }
          )
        }
      ]
    )
    if (updater) {
      logPlayers.user = {
        name: updater.displayName,
        avatar: updater.displayAvatarURL({ size: 128 })
      }
      logFields.push(
        [
          {
            name: "Updater",
            value: mentionFuncs.userMention(
              updater.id,
              { showID: true }
            )
          }
        ]
      )
    } else {
      let clientMember = guild.members.me
      if (clientMember) {
        logPlayers.user = {
          name: clientMember.displayName,
          avatar: clientMember.displayAvatarURL({ size: 128 })
        }
      }
      logFields.push(
        [
          {
            name: "Updater",
            value: "Probably self or bot"
          }
        ]
      )
    }

    logFields.push(
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
          name: "Old Nickname",
          value: oldNick
        }
      ],
      [
        {
          name: "New Nickname",
          value: newNick
        }
      ]
    )

    let logProps = {
      color: client.profile.colors.info,
      title: {
        text: "[Log] Nickname Changed",
        emoji: "✏️"
      },
      players: logPlayers,
      fields: logFields
    }

    // client
    // guild
    // logging-<this> guildchannel key
    // embed props
    await this.logPost(
      client,
      guild,
      "names",
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
      "✏️",
      {
        guild: guild.name,
        member: newMember.user.tag,
        action: "edit",
        oldName: oldNick,
        newName: newNick
      }
    )
  }
}
