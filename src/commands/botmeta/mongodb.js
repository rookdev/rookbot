// @ts-nocheck

// Command Option Types
const { ApplicationCommandOptionType, inlineCode, codeBlock, hyperlink } = require('discord.js')
// BotDevCommand
const { BotDevCommand } = require('../../classes/command/botdevcommand.class')

const stringFuncs = require('../../utils/primitives/stringFuncs')
const fileFuncs = require('../../utils/fs/fileFuncs')
const dbFuncs = require('../../utils/db/dbFuncs')
const shell = require('shelljs')
const fs = require('fs')

module.exports = class MongoDBCommand extends BotDevCommand {
  constructor(client) {
    let comprops = {
      name: "mongodb",
      category: "botmeta",
      description: "Manage MongoDB's dbs for this guild",
      flags: {
        user: "unapplicable"
      },
      options: [
        {
          name: "mode",
          description: "Mode",
          type: ApplicationCommandOptionType.String
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
    let mode = coptions["mode"] ?? "ping"

    let mongodb_crun = null
    try {
      mongodb_crun = shell.exec(
        `node ./src/mongodb/crun.js -m ${mode}`
      )
      mongodb_crun = mongodb_crun.stdout.trim()
    } catch (err) {
      this.messages.push(err.stack)
    }

    // Bucket for console output
    let console_output = [
      "---"
    ]

    console_output.push(
      ("\n" + codeBlock(mongodb_crun))
    )

    let len = console_output.join("\n").length
    if (len < 2000) {
      if (typeof interaction.editReply === "function") {
        await interaction.editReply(
          {
            content: console_output.join("\n")
          }
        )
      } else {
        await interaction.reply(
          {
            content: console_output.join("\n")
          }
        )
      }
      this.null = true
    } else {
      this.props.description = console_output
    }

    return !this.error
  }
}
