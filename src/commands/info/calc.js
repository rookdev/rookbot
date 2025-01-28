// @ts-nocheck

// Command Option Types
const { ApplicationCommandOptionType } = require('discord.js')
// Base Rook Command
const { RookCommand } = require('../../classes/command/rcommand.class.js')
const { evaluate } = require('mathjs')  // Evaluate math expression

module.exports = class CalcCommand extends RookCommand {
  constructor(client) {
    let comprops = {
      name: "calc",
      category: "info",
      description: "Evaluates a math expression",
      options: [
        {
          name: "expression",
          description: "The math expression to evaluate",
          type: ApplicationCommandOptionType.String,
          required: true
        }
      ],
      testOptions: [
        { expression: "2+2" },
        { expression: "2-2" },
        { expression: "2*2" },
        { expression: "2/2" }
      ]
    }
    let props = {
      title: {
        text: "Calculator"
      }
    }

    super(
      client,
      {...comprops},
      {...props}
    )
  }

  // declare props: import('../../types/embed').EmbedProps

  async action(client, interaction, coptions) {
    const expression = coptions.expression  // Get the math expression

    try {
      // Evaluate the math expression
      const result = evaluate(expression)

      // Create and send the embed
      this.props.fields = [
        [
          { name: "Expression", value: expression.codeblock() }
        ],
        [
          { name: "Result",     value: result.codeblock() }
        ]
      ]
    } catch (error) {
      console.error('Error evaluating expression:', error)

      // Send an error embed if the math expression is invalid
      this.error = true
      this.props.description = "Invalid math expression. Please try again."
      return false
    }

    return !this.error
  }
}
