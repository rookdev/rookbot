// @ts-nocheck

// Instance Greeting
const { SalutationCommand } = require('../../classes/command/salutation.class')

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

  async execute(client, interaction, coptions={}, independent=false) {
    // Set EmbedPlayerTypes: Bot|Guild
    this.props.playerTypes = {
      user: "bot",
      target: "guild"
    }

    // Call SalutationCommand.execute() with { mode: "exit" }
    return await super.execute(
      client,
      interaction,
      { mode: "exit" }
    )
  }
}
