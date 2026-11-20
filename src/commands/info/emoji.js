const { ApplicationCommandOptionType } = require('discord.js')
const { MentionCommand } = require('../../classes/command/mention.class')

module.exports = class InfoEmojiCommand extends MentionCommand {
  constructor(client) {
    let comprops = {
      description: "Emoji Info",
      options: [
        {
          name: "emoji",
          description: "Emoji ID",
          type: ApplicationCommandOptionType.String,
          required: true
        }
      ],
      platforms: ["discord"]
    }
    let props = {
      title: {
        text: "Emoji Info"
      }
    }
    super(
      client,
      {...comprops},
      {...props}
    )
  }
}
