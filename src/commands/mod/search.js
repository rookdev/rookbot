// @ts-nocheck

/**
 * Discord Stuff
 *  Command Option Types
 *  Audit Log Events
 *  Permission Flags Bits
 *  Formatters
 *   bold
 *   inlineCode
 *   userMention
 */
const {
  ApplicationCommandOptionType,
  AuditLogEvent,
  PermissionFlagsBits,
  bold,
  inlineCode,
  userMention
} = require('discord.js')
const { ModCommand } = require('../../classes/command/modcommand.class')
const timeFormat = require('../../utils/formatters/timeFormat')
const strtotime = require('locutus/php/datetime/strtotime')
const fileFuncs = require('../../utils/fs/fileFuncs')
const moment = require('moment')

module.exports = class SearchCommand extends ModCommand {
  constructor(client) {
    let comprops = {
      name: "search",
      category: "mod",
      description: "Search Logs",
      flags: {
        bot: "optional",
        target: "required"
      },
      options: [
        {
          name: "search-type",
          description: "Search Type",
          type: ApplicationCommandOptionType.String,
          required: true,
          choices: [
            { name: "Membership",     value: "Change" },
            { name: "Ghost Messages", value: "ghostMessage" },
            { name: "Bans",           value: "Ban" },
            { name: "Mutes",          value: "Mute" },
            { name: "Unbans",         value: "Unban" },
            { name: "Unmutes",        value: "Unmute" },
            { name: "Timeouts",       value: "Timeout" },
            { name: "Warns",          value: "Warn" }
          ]
        },
        {
          name: "target-id",
          description: "User ID to search for",
          type: ApplicationCommandOptionType.String
        },
        {
          name: "guild-id",
          description: "Guild ID to search in",
          type: ApplicationCommandOptionType.String
        },
        {
          name: "region",
          description: "Development or Production Logs?",
          type: ApplicationCommandOptionType.String,
          choices: [
            { name: "Production",   value: "" },
            { name: "Development",  value: "DEV" }
          ]
        }
      ],
      testOptions: [
        {
          "target-id":    "282859044593598464",
          "search-type":  "Change"
        },
        {
          "target-id":    "282859044593598464",
          "search-type":  "Warn"
        },
        {
          "target-id":    "282859044593598464",
          "search-type":  "Mute"
        },
        {
          "target-id":    "282859044593598464",
          "search-type":  "Unmute"
        },
        {
          "target-id":    "282859044593598464",
          "search-type":  "Ban"
        },
        {
          "target-id":    "282859044593598464",
          "search-type":  "Unban"
        }
      ],
      permissions: [ PermissionFlagsBits.ModerateMembers ]
    }
    let props = {}

    super(
      client,
      {...comprops},
      {...props}
    )
  }

  // declare props: import('../../types/embed').EmbedProps

  async action(client, interaction, coptions) {
    let searchType = coptions["search-type"]
    let targetUserInput = coptions["target-id"]
    let region = coptions["region"] ?? (this.DEV ? "DEV" : "")
    let targetUserId = targetUserInput?.replace(/[<@!>]/g, '')  // Remove <@>, <@!>, and >
    let targetUser = null

    let props = {
      mod: {}
    }

    try {
      targetUser = await client.users.fetch(targetUserId)
    } catch (error) {
      props.mod.error = true
      props.mod.description = "User not found."
      this.props = props.mod
      return !props.mod.error
    }
    // Get the guild member (to fetch nickname if present)
    const guildMember = await interaction.guild.members.fetch(targetUserId)
    const user = guildMember?.user ?? targetUser

    let foundLogs = {}
    let i = 0

    if (["DEV",""].includes(region)) {
      let logFile = fileFuncs.getAFile(
        [
          "src",
          "botlogs"
        ],
        region +
        (searchType != "ghostMessage" ? "member": "") +
        searchType +
        "s.log"
      )

      if (!logFile) {
        this.error = true
        this.props.description = `Logs for '${region}${searchType.ucfirst()}' not found!`
        return
      }

      console.log(logFile)

      let logLines = logFile.split("\n")
      for(let line of logLines) {
        line = line.trim()
        if(
          (
            line.includes("Author:") ||
            line.includes("User:")
          ) &&
          line.includes(targetUserId)
        ) {
          let beginning = i
          let running = true
          while(running) {
            if(logLines[beginning].includes("[")) {
              running = false
            } else {
              beginning = beginning - 1
            }
          }
          running = true
          let end = beginning + 1
          while(running) {
            if(
              (logLines[end].includes("[")) ||
              (logLines[end].substring(0,3) == "---") ||
              (logLines[end].trim() == "")
            ) {
              running = false
            } else {
              end = end + 1
            }
          }
          let foundLog = logLines.slice(beginning, end)
          foundLogs[foundLog[0]] = foundLog
        }
        i = i + 1
      }
    }

    if (searchType == "Ban") {
      let now = moment.utc()
      const fetchedLogs = await interaction.guild.fetchAuditLogs({
        type: AuditLogEvent.MemberBanAdd
      })

      const bans = await interaction.guild.bans.fetch()
      const bansJSON = bans.toJSON()
      let slimBans = {}
      let banNum = 0
      for (let ban of bansJSON) {
        delete ban.guild
        const auditEntry = await fetchedLogs?.entries.find(
          a =>
            a.target.id === ban.user.id
        )
        let banner = auditEntry?.executor ?? null
        let bannerData = {}
        if (banner) {
          bannerData = {
            name: banner.username,
            id: banner.id,
            avatar: banner.displayAvatarURL({ size: Math.pow(2, 7) })
          }
        }
        let thisNow = now.format("x") + (banNum * 1000)
        let logEntry = [
          `[${now.toISOString()}]`,
          `User:     ${ban.user.username} (ID: ${ban.user.id})`
        ]
        if (banner) {
          logEntry.push(`Actor:    ${bannerData?.name} (ID: ${bannerData?.id})`)
        }
        logEntry.push(`Action:   Banned`)
        logEntry.push(`Guild:    ${interaction.guild.name} (ID: ${interaction.guild.id})`)
        logEntry.push(`Reason:   ${ban.reason}`)
        logEntry.push(`Region:   Discord`)
        logEntry.push(`--------------------------------`)

        let slimBan = {
          name: ban.user.username + "#" + ban.user.discriminator,
          id: ban.user.id,
          banner: bannerData,
          avatar: ban.user.displayAvatarURL({ size: Math.pow(2, 7) }),
          reason: ban.reason,
          logEntry: {
            [thisNow]: logEntry
          }
        }
        foundLogs[thisNow] = slimBan.logEntry[thisNow]
        banNum += 1
      }
    }

    i = 1
    for(let [timestamp, foundLog] of Object.entries(foundLogs)) {
      // let this_props: import('../../types/embed').EmbedProps = {
      let this_props = {
        title: { text: `Searching ${searchType}s` },
        description: [
          bold(`Target`),
          `${user}`
        ],
        fields: []
      }
      let this_ids = {}
      for(let logLine of foundLog) {
        logLine = logLine.trim()
        if(logLine.includes(": ")) {
          let field_name = logLine.substring(0, logLine.indexOf(": "))
          let field_value = logLine.substring(logLine.indexOf(": ") + ": ".length)
          field_value = field_value.replace(/([\d]{5,})/, "`$1`")
          if (logLine.includes("ID: ")) {
            let matches = logLine.match(/(?:[\D]+) ([\d]+)/)
            if (matches) {
              this_ids[field_name] = matches[1].trim()
            }
          }
          for (let userType of [
            "Actor",
            "Author",
            "User"
          ]) {
            if(field_name.includes(userType)) {
              field_value = `${userMention(this_ids[userType])} [${inlineCode(this_ids[userType])}]`
            }
          }
          if (field_name.includes("Channel")) {
            field_value = `<#${this_ids['Channel']}>` + " " +
              `[${inlineCode(this_ids['Channel'])}]`
          } else if (field_name.includes("Message")) {
            field_name = "Message"
            field_value = "https://discord.com/channels"
            field_value += `/${this_ids['Guild']}`
            field_value += `/${this_ids['Channel']}`
            field_value += `/${this_ids['Message ID']}`
            field_value += ` [${inlineCode(this_ids['Message ID'])}]`
          }
          this_props.fields?.push(
            [
              {
                name: field_name,
                value: field_value
              }
            ]
          )
        } else if(logLine.includes("Z]")) {
          let timestampDateTime = moment.utc(
            logLine
              .replace("[","")
              .replace("]","")
          )
          this_props.fields?.push(
            [
              {
                name: "Time",
                value: timeFormat(timestampDateTime.format("x"), { with: "relative" })
              }
            ]
          )
        }
      }
      this.pages.push(this_props)
      i = i +1
    }

    return true
  }
}
