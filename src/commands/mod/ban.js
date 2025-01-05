// @ts-check

// Command Option Types, Permission Flags
const { ApplicationCommandOptionType, PermissionFlagsBits } = require('discord.js')
// ModCommand
const { ModCommand } = require('../../classes/command/modcommand.class')

module.exports = class BanCommand extends ModCommand {
  constructor(client) {
    let comprops = {
      name: "ban",
      category: "mod",
      description: "Bans a user from the server",
      flags: {
        bot: "optional",
        user: "invalid",
        target: "required"
      },
      options: [
        {
          name: "target-id",
          description: "The ID of the user you want to ban.",
          type: ApplicationCommandOptionType.String,
          required: true
        },
        {
          name: "reason",
          description: "The reason for banning the user.",
          type: ApplicationCommandOptionType.String,
          required: false
        },
        {
          name: "delete-days",
          description: "Number of days of messages to purge from this user.",
          type: ApplicationCommandOptionType.Integer
        }
      ],
      permissions: [ PermissionFlagsBits.BanMembers ]
    }
    let props = {}

    super(
      client,
      {...comprops},
      {...props}
    )
  }
}
