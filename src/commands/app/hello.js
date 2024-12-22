const { SalutationCommand } = require('../../classes/command/salutation.class.js')

/**
 * @class
 * @classdesc Instance Start
 * @this {HelloCommand}
 * @extends {SalutationCommand}
 * @public
 */
module.exports = class HelloCommand extends SalutationCommand {
  constructor(client) {
    let comprops = {
      name: "hello",
      category: "bot",
      description: "Hello"
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
      { mode: "boot" }
    )
  }
}
