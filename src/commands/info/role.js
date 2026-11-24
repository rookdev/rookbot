const { ApplicationCommandOptionType } = require('discord.js')
const { MentionCommand } = require('../../classes/command/mention.class')

module.exports = class InfoRoleCommand extends MentionCommand {
  constructor(client) {
    let comprops = {
      description: "Role Info",
      flags: {
        domain: [
          "guild"
        ]
      },
      options: [
        {
          name: "role",
          description: "Role ID (Role)",
          type: ApplicationCommandOptionType.Role,
          required: true
        }
      ],
      platforms: ["discord"]
    }
    let props = {
      title: {
        text: "Role Info"
      }
    }
    super(
      client,
      {...comprops},
      {...props}
    )
  }
}
