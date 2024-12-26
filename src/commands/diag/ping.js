// @ts-nocheck

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

  // declare props: import('../../types/embed').EmbedProps

  async action(client, interaction, coptions={}) {
    this.props.playerTypes = {
      user: "discord",
      target: "caller"
    }

    console.log(`/${this.name}: Action`)

    const reply = await interaction?.fetchReply()
    const ping = (reply?.createdTimestamp || 0) - (interaction?.createdTimestamp || 0)

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
