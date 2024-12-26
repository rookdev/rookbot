// @ts-nocheck

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

  async execute(client, interaction, coptions={}, independent=false) {
    this.props.playerTypes = {
      user: "bot",
      target: "guild"
    }

    return await super.execute(
      client,
      interaction,
      { mode: "boot" }
    )
  }
}
