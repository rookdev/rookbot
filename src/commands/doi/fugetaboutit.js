// @ts-nocheck

// Base Rook Command
const { RookCommand } = require('../../classes/command/rcommand.class')
const path = require('path')  // Easy filepath management

/**
 * @class
 * @classdesc Pronunciation Tutorial
 * @this {FugetaboutitCommand}
 * @extends {RookCommand}
 */

module.exports = class FugetaboutitCommand extends RookCommand {
  constructor(client) {
    let comprops = {
      name: "fugetaboutit",
      description: "Pronunciation Tutorial",
      category: "doi"
    }
    let props = {}
    super(
      client,
      {...comprops},
      {...props}
    )
  }

  // declare props: import('../../types/embed').EmbedProps

  async execute(client, interaction, coptions={}, independent=false) {
    // Set path to video file
    const videoPath = path.join(
      __dirname,
      "..",
      "..",
      "res",
      "media",
      "fugetaboutit.mp4"
    )

    try {
      // Upload video file
      await interaction.reply(
        {
          files: [ videoPath ]
        }
      )
    } catch (error) {
      this.error = true
      this.props.description = "Error uploading video"
      return false
    }

    return !this.error
  }
}
