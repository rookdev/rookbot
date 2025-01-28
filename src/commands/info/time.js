// @ts-nocheck

// Base Rook Command
const { RookCommand } = require('../../classes/command/rcommand.class.js')
// Use Discord Hammertime
const timeFormat = require('../../utils/timeFormat.js')
const tz = require('timezone')  // Timezone management

module.exports = class TimeCommand extends RookCommand {
  constructor(client) {
    let comprops = {
      name: "time",
      category: "info",
      description: "Time"
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
    const tzs = [
      "Australia/Perth",    // + 8
      "Australia/Adelaide", // + 930
      "Australia/Sydney",   // +10
      "Pacific/Auckland",   // +12
      "America/St_Johns",   // - 2.5
      "America/New_York",   // - 4
      "America/Los_Angeles" // - 7
    ]
    const mytz = tz(
      require("timezone/en_AU"),
      require("timezone/en_US"),
      require("timezone/Australia"),
      require("timezone/Pacific/Auckland"),
      require("timezone/America/St_Johns"),
      require("timezone/America/New_York"),
      require("timezone/America/Los_Angeles")
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
      console.log(tmp)
      this.props.description += tmp + "\n"
    }
    this.props.description = this.props.description.codeblock()

    this.props.description += "\n"
    let tmp = `Local: ` + timeFormat(now)
    this.props.description += tmp
    console.log(tmp)

    return !this.error
  }
}
