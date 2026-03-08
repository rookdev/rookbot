// @ts-nocheck

// Formatters: userMention
const { userMention } = require('discord.js')
// Base Rook Command
const { RookCommand } = require('../../classes/command/rcommand.class')
// Pretty-print time durations
const timeConversion = require('../../utils/formatters/timeConversion')
const mentionFuncs = require('../../utils/formatters/mentions')
const strtotime = require('locutus/php/datetime/strtotime')

module.exports = class UptimeCommand extends RookCommand {
  constructor(client) {
    let comprops = {
      name: "uptime",
      category: "botmeta",
      description: "Uptime",
      flags: {
        user: "unapplicable",
        test: "basic"
      }
    }
    let props = {
      title: { text: "Uptime", emoji: "⏱️" }
    }
    super(
      client,
      {...comprops},
      {...props}
    )
  }

  // declare props: import('../../types/embed').EmbedProps

  async action(client, interaction, coptions={}) {
    // Get uptime
    let uptime = ["stoat"].includes(client.platform) ? await client.readyAt : await client.uptime
    if ((uptime+"").indexOf("T") > -1) {
      uptime = (uptime+"")
      uptime = uptime.replace("T", " ")
      uptime = uptime.replace("Z", "")
      uptime = uptime.substring(0, uptime.indexOf("."))
      uptime = strtotime(uptime)
    }

    // Print uptime
    this.props.description = [
      `${mentionFuncs.userMention(client.user.id)} has been online for:`,
      await timeConversion(uptime)
    ]

    return !this.error
  }
}
