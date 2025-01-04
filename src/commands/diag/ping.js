// @ts-nocheck

// Base Rook Command
const { RookCommand } = require('../../classes/command/rcommand.class')

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

  // declare props: import('../../types/embed').EmbedProps

  async action(client, interaction, coptions={}) {
    // Set EmbedPlayerTypes to Discord|Caller
    this.props.playerTypes = {
      user: "discord",
      target: "caller"
    }

    console.log(`/${this.name}: Action`)

    // Get Reply object
    const reply = await interaction?.fetchReply()
    // Find difference in time
    const ping = (reply?.createdTimestamp ?? 0) - (interaction?.createdTimestamp ?? 0)

    this.props.fields = [
      [
        // Client Ping
        {
          name: "Client",
          value: `${ping}ms`
        },
        // Websocket Ping
        {
          name: "Websocket",
          value: `${client.ws.ping}ms`
        }
      ]
    ]

    return !this.error
  }
}
