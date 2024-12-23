const { ApplicationCommandOptionType, PermissionFlagsBits } = require('discord.js');
const { ModCommand } = require('../../classes/command/modcommand.class.js')

module.exports = class TimeoutCommand extends ModCommand {
  constructor(client) {
    let comprops = {
      name: "timeout",
      category: "mod",
      description: "Times out a user for a specified duration.",
      flags: {
        bot: "optional",
        user: "invalid",
        target: "required"
      },
      options: [
        {
          name: "target-id",
          description: "The ID of the user you want to timeout.",
          type: ApplicationCommandOptionType.String,
          required: true
        },
        {
          name: "duration-seconds",
          description: "The duration of the timeout (in seconds).",
          type: ApplicationCommandOptionType.Integer,
          required: true
        },
        {
          name: "reason",
          description: "The reason for timing out the user.",
          type: ApplicationCommandOptionType.String,
          required: false
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
