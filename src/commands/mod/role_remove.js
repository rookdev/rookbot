const { ApplicationCommandOptionType, PermissionFlagsBits } = require('discord.js');
const { ModCommand } = require('../../classes/command/modcommand.class.js')

module.exports = class RoleRemoveCommand extends ModCommand {
  constructor(client) {
    let comprops = {
      name: "role_remove",
      category: "mod",
      description: "Removes a role from a member",
      flags: {
        bot: "optional",
        user: "invalid",
        target: "required"
      },
      options: [
        {
          name: "target-id",
          description: "The ID of the user you want to remove the role from.",
          type: ApplicationCommandOptionType.String,
          required: true
        },
        {
          name: "role",
          description: "Role to remove",
          type: ApplicationCommandOptionType.String,
          required: true
        },
        {
          name: "reason",
          description: "Reason for adding role",
          type: ApplicationCommandOptionType.String
        }
      ],
      permissions: [ PermissionFlagsBits.ManageRoles ]
    }
    let props = {}

    super(
      client,
      {...comprops},
      {...props}
    )
  }
}
