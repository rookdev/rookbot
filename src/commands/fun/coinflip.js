const { RookCommand } = require("../../classes/command/rcommand.class")

module.exports = class CoinFlipCommand extends RookCommand {
  constructor(client) {
    let comprops = {
      name: "coinflip",
      category: "fun",
      description: "Flips a coin and return either Heads or Tails",
      flags: {
        test: "basic"
      }
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

  async action(client, interaction, coptions={}) {
    // Randomly choose between "Heads" and "Tails"
    const outcome = Math.random() < 0.5 ? 'Heads' : 'Tails'

    this.props.description = `The coin landed on **${outcome}**!`

    return !this.error
  }
}
