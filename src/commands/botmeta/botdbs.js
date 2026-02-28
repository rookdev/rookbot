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

const mentionFuncs = require('../../utils/formatters/mentions')
const stringFuncs = require('../../utils/primitives/stringFuncs')
const fileFuncs = require('../../utils/fs/fileFuncs')
const numFuncs = require('../../utils/primitives/numFuncs')
const dbFuncs = require('../../utils/db/dbFuncs')
const fs = require('fs')

module.exports = class BotDBsCommand extends BotDevCommand {
  constructor(client) {
    let comprops = {
      name: "botdbs",
      category: "botmeta",
      description: "Get rookbot's dbs for this guild",
      flags: {
        user: "unapplicable"
      },
      options: [
        {
          name: "database-type",
          description: "Database Type",
          type: ApplicationCommandOptionType.String,
          maxLength: 32
        }
      ]
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
    this.props.playerTypes = {
      user: "caller",
      target: "bot"
    }

    // Get DB Type
    let db_type = coptions["database-type"] ?? ""

    let guild = interaction.guild

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
          if (filename.includes("channels")) {
            // channels
            for (let [k,v] of Object.entries(thisDB)) {
              if (!k.includes("#") && v != "") {
                this.props.description.push(
                  inlineCode(k) + `: ` + mentionFuncs.channelMention(v)
                )
              }
            }
          } else if (filename.includes("meta")) {
            // meta
            this.props.description.push(
              codeBlock(JSON.stringify(thisDB))
            )
          } else if (filename.includes("roleIDs")) {
            // roleIDs
            for (let [k,v] of Object.entries(thisDB)) {
              if (!k.includes("#") && v != "") {
                this.props.description.push(
                  inlineCode(k) + `: ` + mentionFuncs.roleMention(v),
                  codeBlock(v)
                )
              }
            }
          } else if (filename.includes("roleProfiles")) {
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
          } else if (filename.includes("roles")) {
            // roles
            for (let [rGroup, rList] of Object.entries(thisDB)) {
              if (!rGroup.includes("#")) {
                let roles = []
                for (let rName of rList) {
                  let role = await this.getCache(client, interaction.guild, "roles", rName)
                  if (role) {
                    roles.push(`${role}`)
                  } else {
                    roles.push(inlineCode(`@${rName}`))
                  }
                }
                this.props.description.push(rGroup.boldUnderline() + ": " + roles.join(", "))
              }
            }
          } else if (filename.includes("rrs")) {
            // rrs
            for (let [rrKey, rrData] of Object.entries(thisDB)) {
              if(!rrKey.includes("#")) {
                let channel = await this.getCache(client, interaction.guild, "channels", rrData["#channel"])
                let message = await this.getCache(client, channel, "messages", rrKey)
                // this.props.description.push(rrKey.boldUnderline())
                this.props.description.push(message.url)
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
          } else if (filename.includes("visages")) {
            // visages
            for (let [vKey, vData] of Object.entries(thisDB)) {
              if (!vKey.includes("#")) {
                this.props.description.push(`${inlineCode(vKey)}: ${vData.name}`)
                this.props.description.push(`Avatar: ${hyperlink('Link',vData.avatar)}`)
                this.props.description.push("")
              }
            }
          } else if (filename.includes("voiceChannelNames")) {
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

      let dbRes = await dbFuncs.getDB(guild.id, "", client.platform, "fs")
      fileList = dbRes[0]
      this.messages.push(...dbRes[1])

      this.props.description.push("Filesystem")
      this.props.description.push(
        codeBlock(fileList.join("\n"))
      )
      this.props.description.push("")

      dbRes = await dbFuncs.getDB(guild.id, "", client.platform, "mongodb")
      fileList = dbRes[0]
      this.messages.push(...dbRes[1])

      this.props.description.push("MongoDB")
      this.props.description.push(
        codeBlock(fileList.join("\n"))
      )
      this.props.description.push("")
    }

    return !this.error
  }
}
