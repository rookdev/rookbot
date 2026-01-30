// @ts-nocheck

// Formatters
const { codeBlock } = require('discord.js')
// BotDevCommand
const { BotDevCommand } = require('../../classes/command/botdevcommand.class')
const fileFuncs = require('../../utils/fs/fileFuncs')
const shell = require('shelljs')  // Run shell commands

module.exports = class UpdateCommand extends BotDevCommand {
  constructor(client) {
    let comprops = {
      name: "update",
      category: "app",
      description: "Update Node Modules",
      flags: {
        test: "basic"
      }
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
    // Run Node Update
    let node_update = null
    try {
      node_update = shell.exec("npm run-script update")
      node_update = node_update.stdout.trim()
    } catch (err) {
      this.messages.push(err.stack)
    }

    // Get Client User
    let user = client?.user

    // Bucket for console output
    let console_output = [
      "---"
    ]

    // Print Name & Version number
    console_output.push(
      "Updating " +
      (user ? user.username : "") +
      ` v${this.profile.PACKAGE.version}!`
    )

    console_output.push(
      ("\n" + codeBlock(node_update))
    )

    await interaction.editReply(
      {
        content: console_output.join("\n")
      }
    )
    this.null = true

    return !this.error
  }
}
