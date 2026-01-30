// @ts-nocheck

// Formatters
const { codeBlock } = require('discord.js')
// BotDevCommand
const { BotDevCommand } = require('../../classes/command/botdevcommand.class')
const fileFuncs = require('../../utils/fs/fileFuncs')
const shell = require('shelljs')  // Run shell commands

/**
 * @class
 * @classdesc NPM Install
 * @this {InstallCommand}
 * @extends {BotDevCommand}
 * @public
 */
module.exports = class InstallCommand extends BotDevCommand {
  constructor(client) {
    let comprops = {
      name: "install",
      category: "app",
      description: "Install Node Modules",
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
    // Run npm i
    let node_install = null
    try {
      node_install = shell.exec(
        "npm i"
      )
      node_install = node_install.stdout.trim()
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
      "Installing " +
      (user ? user.username : "") +
      ` v${this.profile.PACKAGE.version}!`
    )

    console_output.push(
      ("\n" + codeBlock(node_install))
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
