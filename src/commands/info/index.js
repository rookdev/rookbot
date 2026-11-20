const { RookCommand } = require('../../classes/command/rcommand.class')

module.exports = class InfoIndexCommand extends RookCommand {
  constructor(client) {
    let comprops = {
      name: "info",
      description: "Info Commands"
    }

    super(
      client,
      {...comprops},
      {}
    )
  }
}
