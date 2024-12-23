const { ApplicationCommandOptionType } = require('discord.js')
const { RookCommand } = require('../../classes/command/rcommand.class')

module.exports = class DiceRollCommand extends RookCommand {
  constructor(client) {
    let comprops = {
      name: "diceroll",
      category: "fun",
      description: "Rolls a specified number of dice with a specified number of sides",
      options: [
        {
          name: "count",
          description: "Number of dice to roll (1-10)",
          type: ApplicationCommandOptionType.Integer,
          min_value: 1,
          max_value: 10,
          required: true
        },
        {
          name: "sides",
          description: "Number of sides on each die (2-9999)",
          type: ApplicationCommandOptionType.Integer,
          min_value: 2,
          max_value: 9999
        }
      ],
      testOptions: [
        { count: 4 },
        { count: 4, sides: 20 },
        { count: 5 },
        { count: 5, sides: 20 }
      ]
    }
    let props = {}

    super(
      client,
      {...comprops},
      {...props}
    )
  }

  async action(client, interaction, coptions) {
    const count = coptions.count
    const sides = coptions.sides ?? 6

    // Roll the dice and collect results
    const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1)
    let total = 0
    for (let roll of rolls) {
      total += roll
    }

    this.props = {
      title: {
        text: `Roll ${count}d${sides}!`
      },
      description: `🎲You got ${rolls.join(', ')} for a total of ${total}`
    }

    return !this.error
  }
}
