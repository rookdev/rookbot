const { RookCommand } = require('../../classes/command/rcommand.class')

module.exports = class GuildIndexCommand extends RookCommand {
  constructor(client) {
    let comprops = {
      name: "guild",
      description: "Guild Commands"
    }

    super(
      client,
      {...comprops},
      {}
    )
  }
}
