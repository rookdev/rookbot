const { RookCommand } = require('../../classes/command/rcommand.class')
const path = require('path');

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

  async execute(client, interaction, coptions={}, independent=false) {
    const videoPath = path.join(
      __dirname,
      "..",
      "..",
      "res",
      "media",
      "fugetaboutit.mp4"
    )

    try {
      await interaction.reply(
        {
          files: [ videoPath ]
        }
      )
    } catch (error) {
      this.error = true
      this.props.description = "Error uploading video"
      return
    }
  }
}
