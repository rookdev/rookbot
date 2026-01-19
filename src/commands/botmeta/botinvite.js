// @ts-nocheck

// Base Rook Command
const { RookCommand } = require('../../classes/command/rcommand.class')

module.exports = class BotInviteCommand extends RookCommand {
  constructor(client) {
    let comprops = {
      name: "botinvite",
      category: "botmeta",
      description: "Invite rookbot",
      flags: {
        test: "basic"
      }
    }
    let props = {
      title: {
        text: "Invite rookbot!",
        url: `https://discord.com/oauth2/authorize?client_id=${client.user.id}`
      },
      description: `Invite [rookbot](https://discord.com/oauth2/authorize?client_id=${client.user.id})!`,
      image: { image: client.user.avatarURL({ size: 128 }) }
    }
    super(
      client,
      {...comprops},
      {...props}
    )
  }

  async action(client, interaction, coptions={}) {
    // all done in constructor
    // Set EmbedPlayerTypes to Bot|Bot
    this.props.playerTypes = {
      user: "bot",
      target: "bot"
    }
    return !this.error
  }
}
