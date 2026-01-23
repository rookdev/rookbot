// @ts-nocheck

// Formatters
const { codeBlock, ApplicationCommandOptionType } = require('discord.js')
// BotDevCommand
const { BotDevCommand } = require('../../classes/command/botdevcommand.class')
const fileFuncs = require('../../utils/fs/fileFuncs')
const shell = require('shelljs')  // Run shell commands

module.exports = class DBCommand extends BotDevCommand {
  constructor(client) {
    let comprops = {
      name: "db",
      category: "app",
      description: "Manage DB",
      options: [
        {
          name: "mode",
          description: "Mode",
          type: ApplicationCommandOptionType.String,
          choices: [
            { name: "Ping",     value: "ping" },
            { name: "Read",     value: "read" },
            { name: "Compare",  value: "compare" }
          ]
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

  async action(client, interaction, coptions={}) {
    // Run DB Checker
    let db_mode = coptions["mode"] ?? "ping"
    let db_check = null
    try {
      db_check = shell.exec(`node ./src/mongodb/crun.js -m ${db_mode}`)
      db_check = db_check.stdout.trim()
    } catch (err) {
      console.log(err.stack)
    }

    // Get Client User
    let user = client?.user

    // Bucket for console output
    let console_output = [
      "---"
    ]

    this.props.title = {
      text: "💿 " + "Manage DB"
    }

    // console.log(console_output)

    /*

    console_output[1] = ---
    console_output[2] = Updating Message
    console_output[3] = Output from npm up

    */

    console_output.push(
      ("\n" + codeBlock(db_check))
    )
    this.props.description = console_output

    return !this.error
  }
}
