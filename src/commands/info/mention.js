const { ApplicationCommandOptionType } = require('discord.js')
const { MentionCommand } = require('../../classes/command/mention.class')

module.exports = class InfoMentionCommand extends MentionCommand {
  constructor(client) {
    let comprops = {
      description: "Mention Info",
      flags: {
        domain: [
          "guild"
        ]
      },
      options: [
        {
          name: "channel",
          description: "Channel ID (Channel)",
          type: ApplicationCommandOptionType.Channel
        },
        {
          name: "role",
          description: "Role ID (Role)",
          type: ApplicationCommandOptionType.Role
        },
        {
          name: "user",
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
