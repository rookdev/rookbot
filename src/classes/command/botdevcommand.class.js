const { PermissionFlagsBits } = require('discord.js')
const { AdminCommand } = require('./admincommand.class')

/**
 * @class
 * @classdesc Build a Command for BotDevs-only
 * @this {BotDevCommand}
 * @extends {AdminCommand}
 * @public
 */
class BotDevCommand extends AdminCommand {
  constructor(client, comprops, props) {
    // BotPerms: Administrator
    comprops.permissions = [ PermissionFlagsBits.Administrator ]
    // Category: BotDev
    comprops.access = comprops?.access ? comprops.access : "BotDev"

    // Create parent object
    super(
      client,
      {...comprops},
      {...props}
    )
  }
}

exports.BotDevCommand = BotDevCommand
