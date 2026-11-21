// @ts-nocheck

// Formatters
const { codeBlock } = require('discord.js')
// Base Rook Command
const { RookCommand } = require('../../classes/command/rcommand.class')
// Use Discord HammerTime
const timeFormat = require('../../utils/formatters/timeFormat')
const tz = require('timezone')  // Timezone management

module.exports = class TimeCommand extends RookCommand {
  constructor(client) {
    let comprops = {
      name: "time",
      category: "misc",
      description: "Time",
      platforms: ["discord", "stoat"]
    }
    let props = {
      title: {
        text: "Time"
      }
    }

    super(
      client,
      {...comprops},
      {...props}
    )
  }

  // declare props: import('../../types/embed').EmbedProps

  async action(client, interaction, coptions={}) {
    const now = Date.now()  // Get now
    // Los Angeles
    // New York
    // St Johns
    // Perth
    // Adelaide
    // Sydney
    // Auckland
    const tzs = [
      "America/Los_Angeles",  // - 7
      "America/New_York",     // - 4
      "America/St_Johns",     // - 2.5
      "Australia/Perth",      // + 8
      "Australia/Adelaide",   // + 930
      "Australia/Sydney",     // +10
      "Pacific/Auckland"      // +12
    ]
    const mytz = tz(
      require("timezone/America/Los_Angeles"),
      require("timezone/America/New_York"),
      require("timezone/America/St_Johns"),
      require("timezone/Australia/Adelaide"),
      require("timezone/Australia/Perth"),
      require("timezone/Australia/Sydney"),
      require("timezone/Pacific/Auckland"),
      require("timezone/en_AU"),
      require("timezone/en_US")
    )

    this.props.description = ""
    for(let zone of tzs) {
      let locale = (zone.includes("America") && !zone.includes("St_Johns")) ? "en_US" : "en_AU"
      let tmp = mytz(now, locale, "%Z: %x %T", zone)
      let labelParts = tmp.split(": ")
      let dateTimeParts = labelParts[1].split(" ")
      tmp = (labelParts[0] + ":").padEnd(5, ' ') + " "
      tmp += dateTimeParts[0].padStart(10, ' ') + " "
      tmp += dateTimeParts[1]
      this.messages.push(tmp)
      this.props.description += tmp + "\n"
    }
    this.props.description = codeBlock(this.props.description)

    this.props.description += "\n"
    let tmp = `Local: ` + timeFormat(now)
    this.props.description += tmp
    this.messages.push(tmp)

    return !this.error
  }
}
