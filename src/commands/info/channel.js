const { ApplicationCommandOptionType } = require('discord.js')
const { MentionCommand } = require('../../classes/command/mention.class')

module.exports = class InfoChannelCommand extends MentionCommand {
  constructor(client) {
    let comprops = {
      description: "Channel Info",
      flags: {
        domain: [
          "guild"
        ]
      },
      options: [
        {
          name: "channel",
          description: "Channel ID (Channel)",
          type: ApplicationCommandOptionType.Channel,
          required: true
        }
      ],
      platforms: ["discord"]
    }
    let props = {
      title: {
        text: "Channel Info"
      }
    }
    super(
      client,
      {...comprops},
      {...props}
    )
  }
}
