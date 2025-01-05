// @ts-nocheck

// Command Option Types, Formatters: codeBlock
const { ApplicationCommandOptionType, codeBlock } = require('discord.js')
// Base Rook Command
const { RookCommand } = require('../../classes/command/rcommand.class')

module.exports = class ColorCommand extends RookCommand {
  constructor(client) {
    let comprops = {
      name: "color",
      category: "info",
      description: "Displays information about a hex color code",
      options: [
        {
          name: "hex",
          description: "A hex color code (e.g., #FF5733 or FF5733)",
          type: ApplicationCommandOptionType.String,
          required: true
        }
      ],
      testOptions: [
        { hex: "FFAF00" },
        { hex: "c8a0c8" },
        { hex: "#FFAF00" },
        { hex: "#c8a0c8" }
      ]
    }
    let props = {}

    super(
      client,
      {...comprops},
      {...props}
    )
  }

  // declare props: import('../../types/embed').EmbedProps

  async action(client, interaction, coptions) {
    // Get hex color input
    const hexInput = coptions.hex.replace('#', '').toUpperCase()

    // Validate hex string
    const hexRegex = /^[0-9A-F]{6}$/
    if (!hexRegex.test(hexInput)) {
      this.error = true
      this.props.description = "Invalid hex color code. Please provide a valid 6-character hexadecimal string (e.g., #FF5733 or FF5733)."
      return !this.error
    }

    // Convert hex to RGB
    const r = parseInt(hexInput.substring(0, 2), 16)
    const g = parseInt(hexInput.substring(2, 4), 16)
    const b = parseInt(hexInput.substring(4, 6), 16)
    let dims = "50x50"

    // Create the embed
    this.props = {
      color: `${hexInput}`,
      title: {
        text: "Color Information"
      },
      image: { image: `https://png-pixel.com/${dims}-${hexInput.toLowerCase()}ff.png` },
      fields: [
        [
          { name: 'Hex', value: codeBlock(`#${hexInput}`) },
          { name: 'RGB', value: codeBlock(`(${r}, ${g}, ${b})`) }
        // ],
        // [
        //   { name: 'HSL', value: codeBlock("(" + rgbToHsl(r, g, b).join(", ") + ")") },
        //   { name: 'HSV', value: codeBlock("(" + rgbToHsv(r, g, b).join(", ") + ")") }
        ]
      ]
    }

    return !this.error
  }
}
