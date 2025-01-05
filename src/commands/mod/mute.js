// @ts-check

// Command Option Types, Permission Flags
const { ApplicationCommandOptionType, PermissionFlagsBits } = require('discord.js')
// ModCommand
const { ModCommand } = require('../../classes/command/modcommand.class')

module.exports = class MuteCommand extends ModCommand {
  constructor(client) {
    let comprops = {
      name: "mute",
      category: "mod",
      description: "Mutes a user in the server",
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
          name: "member-role-id",
          description: "The ID of the Member Role you want to remove",
          type: ApplicationCommandOptionType.String
        },
        {
          name: "muted-role-id",
          description: "The ID of the Muted Role you want to add",
          type: ApplicationCommandOptionType.String
        },
        {
          name: "reason",
          description: "The reason for banning the user.",
          type: ApplicationCommandOptionType.String,
          required: false
        }
      ],
      testOptions: [
        {
          "target-id":      "282859044593598464",
          "member-role-id": "member",
          "muted-role-id":  "muted"
        },
        {
          "target-id":      "282859044593598464",
          "member-role-id": "member",
          "muted-role-id":  "muted",
          "reason":         "Because"
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
