const { ApplicationCommandOptionType } = require('discord.js')
const { MentionCommand } = require('../../classes/command/mention.class')

module.exports = class InfoUserCommand extends MentionCommand {
  constructor(client) {
    let comprops = {
      description: "User Info",
      options: [
        {
          name: "user-id",
          description: "User ID (User)",
          type: ApplicationCommandOptionType.User,
          required: true
        }
      ],
      platforms: ["discord"]
    }
    let props = {
      title: {
        text: "User Info"
      }
    }
    super(
      client,
      {...comprops},
      {...props}
    )
  }
}
