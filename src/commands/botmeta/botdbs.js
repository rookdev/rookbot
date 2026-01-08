// @ts-nocheck

// Command Option Types
const { ApplicationCommandOptionType, inlineCode, codeBlock, hyperlink } = require('discord.js')
// BotDevCommand
const { BotDevCommand } = require('../../classes/command/botdevcommand.class')

const stringFuncs = require('../../utils/primitives/stringFuncs')
const fileFuncs = require('../../utils/fs/fileFuncs')

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
    this.props.playerTypes = {
      user: "caller",
      target: "bot"
    }

    // Get DB Type
    let db_type = coptions["database-type"] ?? "visages"

    let guild = interaction.guild

    this.props.title = {
      text: `${guild.name}'s Setup`
    }

    // roleProfiles.json
    //  Role Profiles
    // voiceChannelNames.json
    //  Channel Name Parts for Voice Channels

    this.props.description = []
    for (let filename of [db_type]) {
      let thisDB = fileFuncs.getAFile(
        [
          "src",
          "dbs",
          guild.id,
          `${filename}.json`
        ]
      )
      if (thisDB) {
        if (filename.includes("channels")) {
          for (let [k,v] of Object.entries(thisDB)) {
            if (!k.includes("#") && v != "") {
              this.props.description.push(
                inlineCode(k),
                `<#${v}>`,
                codeBlock(v)
              )
            }
          }
        } else if (filename.includes("meta")) {
          this.props.description.push(
            codeBlock(JSON.stringify(thisDB))
          )
        } else if (filename.includes("roleIDs")) {
          for (let [k,v] of Object.entries(thisDB)) {
            if (!k.includes("#") && v != "") {
              this.props.description.push(
                inlineCode(k),
                `<@&${v}>`,
                codeBlock(v)
              )
            }
          }
        } else if (filename.includes("roleProfiles")) {
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
          for (let [rGroup, rList] of Object.entries(thisDB)) {
            this.props.description.push(rGroup.boldUnderline())
            for (let rName of rList) {
              this.props.description.push(inlineCode(`@${rName}`))
            }
            this.props.description.push("")
          }
        } else if (filename.includes("visages")) {
          for (let [vKey, vData] of Object.entries(thisDB)) {
            this.props.description.push(vData.name)
            this.props.description.push(`Key: ${inlineCode(vKey)}`)
            this.props.description.push(`Avatar: ${hyperlink('Link',vData.avatar)}`)
            this.props.description.push("")
          }
        } else {
          let lines = []
          for (let [k, v] of Object.entries(thisDB)) {
            lines.push(`${k}: ${JSON.stringify(v)}`)
          }
          this.props.description.push(codeBlock(lines.join("\n")))
          this.props.description.push("")
        }
      }
    }

    return !this.error
  }
}
