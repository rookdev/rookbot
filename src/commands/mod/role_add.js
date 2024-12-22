const { ApplicationCommandOptionType, PermissionFlagsBits } = require('discord.js');
const { ModCommand } = require('../../classes/command/modcommand.class.js')

module.exports = class RoleAddCommand extends ModCommand {
  constructor(client) {
    let comprops = {
      name: "role_add",
      category: "mod",
      description: "Adds a role to a member",
      flags: {
        bot: "optional",
        user: "invalid",
        target: "required"
      },
      options: [
        {
          name: "target-id",
          description: "The ID of the user you want to add the role to.",
          type: ApplicationCommandOptionType.String,
          required: true
        },
        {
          name: "role",
          description: "Role to add",
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
