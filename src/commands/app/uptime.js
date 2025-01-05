// @ts-nocheck

// Base Rook Command
const { RookCommand } = require('../../classes/command/rcommand.class')
// Pretty-print time durations
const timeConversion = require('../../utils/timeConversion')

module.exports = class UptimeCommand extends RookCommand {
  constructor(client) {
    let comprops = {
      name: "uptime",
      category: "app",
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
    const uptime = await client.uptime

    // Print uptime
    this.props.description = [
      `<@${client.user.id}> has been online for:`,
      await timeConversion(uptime)
    ]

    return !this.error
  }
}
