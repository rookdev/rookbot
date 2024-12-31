// @ts-nocheck

// Permission Flags
const { PermissionFlagsBits } = require('discord.js')
// ModCommand
const { ModCommand } = require('../../classes/command/modcommand.class')
const { PurgeCommand } = require('../mod/purge')

module.exports = class ClearCommand extends ModCommand {
  constructor(client) {
    let comprops = {
      name: "clear",
      category: "mod",
      description: "Clear Messages",
      permissions: [ PermissionFlagsBits.ManageMessages ]
    }

    super(
      client,
      {...comprops},
      {}
    )
  }

  // declare props: import('../../types/embed').EmbedProps

  async execute(client, interaction, coptions={}, independent=false) {
    let cmd = new PurgeCommand(client)
    let options = {
      amount: 100
    }
    return await cmd.execute(
      client,
      interaction,
      options
    )
  }
}
