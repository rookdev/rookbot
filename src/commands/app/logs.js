// @ts-nocheck

// Formatters
const { codeBlock, Application, ApplicationCommandOptionType, AttachmentBuilder } = require('discord.js')
// BotDevCommand
const { BotDevCommand } = require('../../classes/command/botdevcommand.class')
const fileFuncs = require('../../utils/fs/fileFuncs')
const shell = require('shelljs')  // Run shell commands

/**
 * @class
 * @classdesc Logs
 * @this {LogsCommand}
 * @extends {BotDevCommand}
 * @public
 */
module.exports = class LogsCommand extends BotDevCommand {
  constructor(client) {
    let comprops = {
      name: "logs",
      category: "app",
      description: "Logs",
      options: [
        {
          name: "mode",
          description: "Mode",
          type: ApplicationCommandOptionType.String
        }
      ],
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
    let mode = coptions.mode ?? "health"

    let rook = "minrook"
    let region = this.DEV ? "dev" : "prod"
    let cmd = ""

    if (mode.indexOf("recent") > -1) {
      cmd = `journalctl -u ${rook}-${region} -n 100 --no-pager`
    } else if (mode.indexOf("stop") > -1) {
      cmd = `cat /opt/${rook}/crashlogs/last-stop.log`
    } else if (mode.indexOf("health") > -1) {
      cmd = `systemctl is-active ${rook}-${region}`
    }

    let shellRes = null
    try {
      shellRes = shell.exec(cmd, { silent: true })
      if (shellRes?.stdout) {
        shellRes = shellRes.stdout.trim()
        shellRes = shellRes.split("\n")
        let search = "]: "
        shellRes = shellRes.map(
          line => line.substring(
            line.indexOf(search) +
            search.length
          )
        )
        shellRes = shellRes.join("\n")
      }
    } catch (err) {
      this.messages.push(err.stack)
    }

    // Bucket for console output
    let display_output = [
      "---"
    ]
    let txt_output = [
      "---"
    ]
    display_output.push(codeBlock(cmd))
    display_output.push(codeBlock(shellRes))
    display_output = display_output.join("\n")

    txt_output.push(cmd)
    txt_output.push(shellRes)
    txt_output = txt_output.join("\n")

    let resLen = display_output.length

    if (resLen < 2000) {
      await interaction.editReply(
        {
          content: display_output
        }
      )
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
