const { ChatInputCommandInteraction } = require("discord.js");

class FakeInteraction extends ChatInputCommandInteraction {
  constructor(comprops) {
    super(
      comprops.client,
      {
        type: 2,
        user: comprops.guild.members.me,
        entitlements: [],
        data: comprops.cmd
      }
    )
    this.channelId = comprops.channelId
    this.guildId = comprops.guild.id
    this.member = comprops.guild.members.me
  }
}

exports.FakeInteraction = FakeInteraction
