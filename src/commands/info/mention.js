const { ApplicationCommandOptionType } = require('discord.js')
const { MentionCommand } = require('../../classes/command/mention.class')

module.exports = class InfoMentionCommand extends MentionCommand {
  constructor(client) {
    let comprops = {
      description: "Mention Info",
      options: [
        {
          name: "channel-id",
          description: "Channel ID (Channel)",
          type: ApplicationCommandOptionType.Channel
        },
        {
          name: "role-id",
          description: "Role ID (Role)",
          type: ApplicationCommandOptionType.Role
        },
        {
          name: "user-id",
          description: "User ID (User)",
          type: ApplicationCommandOptionType.User
        }
      ],
      platforms: ["discord"]
    }
    let props = {
      title: {
        text: "Mention Info"
      }
    }
    super(
      client,
      {...comprops},
      {...props}
    )
  }
}
