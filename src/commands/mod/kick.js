// @ts-check

// Command Option Types
const { ApplicationCommandOptionType } = require('discord.js')
// ModCommand
const { ModCommand } = require('../../classes/command/modcommand.class')

module.exports = class KickCommand extends ModCommand {
  constructor(client) {
    let comprops = {
      name: "kick",
      category: "mod",
      description: "Kicks a user from the server.",
      flags: {
        bot: "optional",
        user: "invalid",
        target: "required"
      },
      options: [
        {
          name: "target-id",
          description: "The ID of the user you want to kick.",
          type: ApplicationCommandOptionType.String,
          required: true
        },
        {
          name: "reason",
          description: "The reason for kicking the user.",
          type: ApplicationCommandOptionType.String,
          required: false
        }
      ]
    }
    let props = {}

    super(
      client,
      {...comprops},
      {...props}
    )
  }
}
