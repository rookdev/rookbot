const { BotDevCommand } = require('../../classes/command/botdevcommand.class')

module.exports = class BotIndexCommand extends BotDevCommand {
  constructor(client) {
    let comprops = {
      name: "bot",
      description: "Bot Commands"
    }

    super(
      client,
      {...comprops},
      {}
    )
  }
}
