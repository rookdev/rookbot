const { RookCommand } = require('../../classes/command/rcommand.class.js')
const timeConversion = require('../../utils/timeConversion.js')

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
  async action(client, interaction, coptions={}) {
    const uptime = await client.uptime
    this.props.description = [
      `<@${client.user.id}> has been online for:`,
      await timeConversion(uptime)
    ]

    return !this.error
  }
}
