const { SalutationCommand } = require('../../classes/command/salutation.class.js')
const { UptimeCommand } = require('../../commands/app/uptime.js')

/**
 * @class
 * @classdesc Instance Exit
 * @this {GoodbyeCommand}
 * @extends {SalutationCommand}
 * @public
 */
module.exports = class GoodbyeCommand extends SalutationCommand {
  constructor(client) {
    let comprops = {
      name: "goodbye",
      category: "bot",
      description: "Goodbye"
    }
    super(
      client,
      {...comprops},
      {}
    )
  }

  async execute(client, interaction) {
    await super.execute(
      client,
      interaction,
      { mode: "exit" }
    )
  }
}
