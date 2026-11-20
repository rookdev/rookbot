const { ApplicationCommandOptionType } = require('discord.js')
const { MentionCommand } = require('../../classes/command/mention.class')

module.exports = class InfoMessageCommand extends MentionCommand {
  constructor(client) {
    let comprops = {
      description: "Message Info",
      options: [
        {
          name: "message-url",
          description: "Message URL",
          type: ApplicationCommandOptionType.String,
          required: true
        }
      ],
      platforms: ["discord"]
    }
    let props = {
      title: {
        text: "Message Info"
      }
    }
    super(
      client,
      {...comprops},
      {...props}
    )
  }
}
