// @ts-nocheck

// Base Rook Command
const { RookCommand } = require("../../classes/command/rcommand.class")
// Formatters: bold
const { bold } = require('discord.js')

module.exports = class CoinFlipCommand extends RookCommand {
  constructor(client) {
    let comprops = {
      name: "coinflip",
      category: "fun",
      description: "Flips a coin and return either Heads or Tails",
      flags: {
        test: "basic"
      },
      platforms: ["discord", "stoat"]
    }
    let props = {
      title: {
        text: "Flip a coin!"
      }
    }

    super(
      client,
      {...comprops},
      {...props}
    )
  }

  // declare props: import('../../types/embed').EmbedProps

  async action(client, interaction, coptions={}) {
    // Randomly choose between "Heads" and "Tails"
    const outcome = Math.random() < 0.5 ? 'Heads' : 'Tails'

    this.props.description = `The coin landed on ${bold(outcome)}!`

    return !this.error
  }
}
