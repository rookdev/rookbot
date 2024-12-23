const { BotDevCommand } = require('../../classes/command/botdevcommand.class.js')
const shell = require('shelljs')

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

  async action(client, interaction, coptions={}) {
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

    let user = client?.user

    let console_output = [
      "---"
    ]

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

    console_output.push(`
      \`\`\`` + "\n" +
      node_install +
      `\`\`\`
    `)
    this.props.description = console_output

    return !this.error
  }
}
