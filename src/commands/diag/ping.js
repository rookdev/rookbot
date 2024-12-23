const { ChatInputCommandInteraction } = require('discord.js')
const { RookCommand } = require('../../classes/command/rcommand.class')
const { RookClient } = require('../../classes/objects/rclient.class')

module.exports = class PingCommand extends RookCommand {
  constructor(client) {
    let comprops = {
      name: "ping",
      category: "diagnostic",
      description: "Pong!",
      flags: {
        test: "basic"
      }
    }
    let props = {
      title: { text: "Pong!" }
    }
    super(
      client,
      {...comprops},
      {...props}
    )
  }

  /**
   * Do the thing!
   * @param {RookClient}            client  Client Object
   * @param {ChatInputCommandInteraction | null} interaction Interaction that called this command
   * @returns
   */
  async action(client, interaction, coptions={}) {
    console.log(`/${this.name}: Action`)

    const reply = await interaction.fetchReply()
    const ping = reply.createdTimestamp - interaction.createdTimestamp

    // Entities
    let entities = {
      bot: {
        name:     client.user.name,
        avatar:   client.user.avatarURL(),
        username: client.user.username
      },
      user: {
        name:     interaction.user.displayName,
        avatar:   interaction.user.avatarURL(),
        username: interaction.user.username
      },
      discord: { name: "Discord", avatar: "https://cdn.iconscout.com/icon/free/png-512/free-discord-logo-icon-download-in-svg-png-gif-file-formats--social-media-pack-logos-icons-3073764.png?f=webp&w=256" }
    }
    // Players
    this.props.players = {
      user: entities.bot,
      target: entities.discord
    }

    this.props.fields = [
      [
        {
          name: "Client",
          value: `${ping}ms`
        },
        {
          name: "Websocket",
          value: `${client.ws.ping}ms`
        }
      ]
    ]

    return !this.error
  }
}
