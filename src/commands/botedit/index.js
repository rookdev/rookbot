const { BotDevCommand } = require('../../classes/command/botdevcommand.class')

module.exports = class BotEditIndexCommand extends BotDevCommand {
  constructor(client) {
    let comprops = {
      name: "botedit",
      description: "Bot Edit Commands"
    }

    super(
      client,
      {...comprops},
      {}
    )
  }
}
