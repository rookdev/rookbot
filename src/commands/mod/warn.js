// @ts-check

// Command Option Types, Permission Flags
const { ApplicationCommandOptionType, PermissionFlagsBits } = require('discord.js')
// ModCommand
const { ModCommand } = require('../../classes/command/modcommand.class')

module.exports = class WarnCommand extends ModCommand {
  constructor(client) {
    let comprops = {
      name: "warn",
      category: "mod",
      description: "Warns a user in the server.",
      flags: {
        bot: "optional",
        user: "invalid",
        target: "required"
      },
      options: [
        {
          name: "target-id",
          description: "The ID of the user you want to warn.",
          type: ApplicationCommandOptionType.String,
          required: true,
        },
        {
          name: "reason",
          description: "The reason for warning the user.",
          type: ApplicationCommandOptionType.String,
          required: false,
        },
      ],
      testOptions: [
        {
          "target-id":  "282859044593598464"
        },
        {
          "target-id":  "282859044593598464",
          "reason":     "Because"
        }
      ],
      permissions: [ PermissionFlagsBits.ModerateMembers ]
    }
    let props = {}

    super(
      client,
      {...comprops},
      {...props}
    )
  }
}
