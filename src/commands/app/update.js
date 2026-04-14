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
    let display_output = [
      "---"
    ]
    let txt_output = [
      "---"
    ]

    // Print Name & Version number
    display_output.push(
      "Updating " +
      (user ? user.username : "") +
      ` v${this.profile.PACKAGE.version}!`
    )
    txt_output.push(
      "Updating " +
      (user ? user.username : "") +
      ` v${this.profile.PACKAGE.version}!`
    )

    display_output.push(
      ("\n" + codeBlock(node_update))
    )
    display_output = display_output.join("\n")

    txt_output.push(
      ("\n" + node_update)
    )
    txt_output = txt_output.join("\n")

    let resLen = display_output.length

    if (resLen < 2000) {
      if (typeof interaction.editReply == "function") {
        await interaction.editReply(
          {
            content: display_output
          }
        )
      } else {
        await interaction.reply(
          {
            content: display_output
          }
        )
      }
      this.null = true
    } else if (resLen < 4096) {
      this.props.description = display_output
    } else {
      let attachment = new AttachmentBuilder()
        .setName(`${mode}.log.txt`)
        .setFile(Buffer.from(txt_output))
      await interaction.editReply(
        {
          content: "See attached!",
          files: [ attachment ]
        }
      )
      this.null = true
    }

    return !this.error
  }
}
