// @ts-nocheck

// Formatters
const { codeBlock } = require('discord.js')
// BotDevCommand
const { BotDevCommand } = require('../../classes/command/botdevcommand.class')
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
        "npm i",
        { silent: true }
      )
      node_install = node_install.stdout.trim()
    } catch (err) {
      console.log(err.stack)
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
    this.props.title = {
      text: "💿 " + console_output[1],
      url: "https://github.com/mysterypaintwo/rookbot"
    }

    // console.log(console_output)

    /*

    console_output[1] = ---
    console_output[2] = Installing Message
    console_output[3] = Output from npm i

    */

    console_output.push(
      ("\n" + codeBlock(node_install))
    )
    this.props.description = console_output

    return !this.error
  }
}
