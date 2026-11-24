// @ts-nocheck

// Command Option Types
const {
  ApplicationCommandOptionType,
  inlineCode,
  codeBlock,
  hyperlink,
  italic,
  underline,
  roleMention
} = require('discord.js')
// BotDevCommand
const { BotDevCommand } = require('../../classes/command/botdevcommand.class')

const BirthdayNotifCommand = require('../botdo/bdaynotif')
const mentionFuncs = require('../../utils/formatters/mentions')
const globalFuncs = require('../../utils/primitives/globalFuncs')
const stringFuncs = require('../../utils/primitives/stringFuncs')
const fileFuncs = require('../../utils/fs/fileFuncs')
const numFuncs = require('../../utils/primitives/numFuncs')
const dbFuncs = require('../../utils/db/dbFuncs')
const fs = require('fs')

module.exports = class BotEditDBsCommand extends BotDevCommand {
  constructor(client) {
    let comprops = {
      name: "dbs",
      category: "botedit",
      description: "Get rookbot's dbs for this guild",
      flags: {
        user: "unapplicable",
        domain: [
          "guild"
        ]
      },
      options: [
        {
          name: "database-type",
          description: "Database Type",
          type: ApplicationCommandOptionType.String,
          maxLength: 32
        }
      ],
      playerTypes: {
        user:   "bot",
        target: "guild"
      },
      platforms: ["discord", "stoat"]
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
    let messages = []
    let newMessages = []
    let fileList = []

    // Get DB Type
    let db_type = coptions["database-type"] ?? ""

    let guild = await this.getGuild(interaction)

    this.props.title = {
      text: `${guild.name}'s Setup`
    }

    // roleProfiles.json
    //  Role Profiles
    // voiceChannelNames.json
    //  Channel Name Parts for Voice Channels

    this.props.description = []
    if (db_type != "") {
      for (let filename of [db_type]) {
        let thisDB = null
        // DB
        let dbRes = await dbFuncs.getDB(
          guild.id,
          filename
        )
        thisDB = dbRes[0]
        this.messages.push(...dbRes[1])
        // /DB
        this.props.title.text += `: ${filename}`

        if (thisDB) {
          if (filename.startsWith("autoroles") || filename.startsWith("roleLogging")) {
            for (let [k,v] of Object.entries(thisDB)) {
              if (!k.includes("#") && v != "") {
                let role = await this.getCache(client, guild, "roles", v)
                this.props.description.push(
                  inlineCode((role.id+"").padStart(20)) + ': ' +
                  mentionFuncs.roleMention(role.id)
                )
              }
            }
          } else if (filename.startsWith("bdays")) {
            let bdayNotifCommand = new BirthdayNotifCommand(client)
            let bdayNotifResult = await bdayNotifCommand.execute(
              client,
              interaction,
              {},
              true
            )
            this.null = true
            return true
          } else if (filename.startsWith("channels")) {
            // channels
            let channels = [
              "welcome",              // Welcome
              "rules",                // Rules
              "roles",                // Role Request
              "resources",            // Resources
              "verify",               // Verify for Access
              "stream-alerts-owner",  // Stream Alerts for Owner
              "stream-alerts",        // Stream Alerts
              "boost-alerts",         // Boost Alerts
              "multiworld-planning",  // Multiworld Planning
              "logging",              // Catch-all Logging
              "logging-ban",          // Bans
              "logging-boosts",       // Server Boosts
              "logging-invites",      // Guild Invites
              "logging-kick",         // Kicks
              "logging-members",      // Members Join/Leave
              "logging-messages",     // Message Edits/Deletions
              "logging-names",        // Nicknames
              "logging-pins",         // Message Pins
              "logging-roles",        // Roles
              "logging-say",          // /say
              "logging-unban",        // Unbans
              "logging-warn",         // Warns
              "logging-vclogs",       // VC Join/Leave
              "bot-salutations",      // Bot Hello/Goodbye
              "bot-console",          // Bot Console
              "bot-testing",          // Bot Testing
              "zapper"                // Bot Zapper
            ]
            for (let k of channels) {
              let v = client.profile.emojis.no
              if ((k in thisDB) && (thisDB[k] != "")) {
                v = thisDB[k]
                v = mentionFuncs.channelMention(v)
              }
              this.props.description.push(
                inlineCode(k.padEnd("multiworld-planning".length)) + `: ` + v
              )
            }
          } else if (filename.startsWith("meta")) {
            // meta
            this.props.description.push(
              codeBlock(JSON.stringify(thisDB))
            )
          } else if (filename.startsWith("roleIDs")) {
            // roleIDs
            for (let [k,v] of Object.entries(thisDB)) {
              if (!k.includes("#") && v != "") {
                this.props.description.push(
                  inlineCode(k) + `: ` + mentionFuncs.roleMention(v),
                  codeBlock(v)
                )
              }
            }
          } else if (filename.startsWith("roleProfiles")) {
            // roleProfiles
            for (let [pName, pData] of Object.entries(thisDB)) {
              this.props.description.push(pName.boldUnderline())
              if (pData?.add) {
                this.props.description.push(`Add: ${inlineCode(JSON.stringify(pData.add))}`)
              }
              if (pData?.remove) {
                this.props.description.push(`Remove: ${inlineCode(JSON.stringify(pData.remove))}`)
              }
              if (pData?.prefix) {
                this.props.description.push(`Prefix: ${inlineCode(pData.prefix)}`)
              }
              this.props.description.push("")
            }
          } else if (filename.startsWith("roles")) {
            // roles
            let roleTypes = [
              "owner",            // Owner
              "streaming-owner",  // Owner when Streaming
              "admin",            // Admin
              "botdev",           // BotDev
              "bot",              // Bot
              "mod",              // Moderator
              "captain",          // Captain
              "streaming-member", // Member when Streaming
              "booster",          // Server Booster
              "access",           // Server Access
              "member",           // Server Member
              "server-tag",       // Has Server Tag
              "muted"             // Muted
            ]
            for (let rGroup of roleTypes) {
              let roles = []
              if (rGroup in thisDB) {
                let rList = thisDB[rGroup]
                for (let rName of rList) {
                  let role = await this.getCache(client, interaction.guild, "roles", rName)
                  if (role) {
                    roles.push(`${role}`)
                  } else {
                    roles.push(inlineCode(`@${rName}`))
                  }
                }
              }
              if (globalFuncs.empty(roles)) {
                roles.push(client.profile.emojis.no)
              }
              this.props.description.push(inlineCode(rGroup.padEnd("streaming-member".length)) + ": " + roles.join(", "))
            }
          } else if (filename.startsWith("rrs")) {
            // rrs
            for (let [rrKey, rrData] of Object.entries(thisDB)) {
              if(!rrKey.includes("#")) {
                let channel = await this.getChannel(client, interaction, rrData["#channel"])
                let message = null
                if (channel) {
                  message = await this.getCache(client, channel, "messages", rrKey)
                }
                if (message?.url) {
                  this.props.description.push(message.url)
                } else {
                  this.props.description.push(rrKey.boldUnderline())
                }
                this.props.description.push(
                  underline(rrData["#title"]) + ": " +
                  italic(rrData["#description"])
                )
                let rrList = []
                for (let [rrEmoji, rrRole] of Object.entries(rrData)) {
                  if (!rrEmoji.includes("#")) {
                    let desc = ""
                    if (typeof rrRole == "object") {
                      desc = rrRole?.description
                      rrRole = rrRole?.role
                    }
                    let emoji = await this.getCache(client, interaction.guild, "emojis", rrEmoji)
                    if (rrRole) {
                      rrRole = await this.getCache(client, interaction.guild, "roles", rrRole)
                    } else {
                      rrRole = inlineCode(`@${rrRole}`)
                    }
                    let rStr = `${emoji}: ${rrRole}`
                    if (desc != "") {
                      rStr += `: ${desc}`
                    }
                    rrList.push(rStr)
                  }
                }
                this.props.description.push(rrList.join("\n"))
                this.props.description.push("")
              }
            }
          } else if (filename.startsWith("visages")) {
            // visages
            for (let [vKey, vData] of Object.entries(thisDB)) {
              if (!vKey.includes("#")) {
                this.props.description.push(`${inlineCode(vKey)}: ${vData.name}`)
                this.props.description.push(`Avatar: ${hyperlink('Link',vData.avatar)}`)
                this.props.description.push("")
              }
            }
          } else if (filename.startsWith("voiceChannelNames")) {
            // voiceChannelNames
            for (let [vKey, vData] of Object.entries(thisDB)) {
              if (!vKey.includes("#")) {
                let line = vKey.ucfirst() + ": "
                if (vKey == "mode") {
                  line += vData.ucfirst()
                } else if (vKey == "categories") {
                  vData = vData.map(c=>mentionFuncs.channelMention(c))
                  line += vData.join(", ")
                } else {
                  line += codeBlock(JSON.stringify(vData))
                }
                this.props.description.push(line)
              }
            }
          } else {
            // else
            let lines = []
            for (let [k, v] of Object.entries(thisDB)) {
              lines.push(`${k}: ${JSON.stringify(v)}`)
            }
            this.props.description.push(codeBlock(lines.join("\n")))
            this.props.description.push("")
          }
        }
      }
    } else {
      let guildPath = fileFuncs.getAPath(
        [
          "src",
          "dbs",
          guild.id
        ]
      )

      let dbs = {}

      let dbRes = await dbFuncs.getDB(guild.id, "", client.platform, "fs")
      fileList = dbRes[0]
      this.messages.push(...dbRes[1])

      for (let fsFile of fileList) {
        fsFile = fsFile.replace(".json","")
        if (!(fsFile in dbs)) {
          dbs[fsFile] = [ "fs" ]
        }
      }

      dbRes = await dbFuncs.getDB(guild.id, "", client.platform, "mongodb")
      fileList = dbRes[0]
      this.messages.push(...dbRes[1])

      for (let mongoFile of fileList) {
        if (!(mongoFile in dbs)) {
          dbs[mongoFile] = [ "mongo" ]
        } else {
          dbs[mongoFile].push("mongo")
        }
      }

      for (let dbType of Object.keys(dbs).sort()) {
        let dbSources = dbs[dbType]
        this.props.description.push(
          (dbSources.contains("fs")     ? client.profile.emojis.fs    : client.profile.emojis.no) +
          (dbSources.contains("mongo")  ? client.profile.emojis.mongo : client.profile.emojis.no) +
          inlineCode(dbType)
        )
      }
    }

    return !this.error
  }
}
