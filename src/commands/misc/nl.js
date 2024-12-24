// @ts-nocheck

const { RookCommand } = require('../../classes/command/rcommand.class')

module.exports = class NLCommand extends RookCommand {
  constructor(client) {
    let comprops = {
      name: "nl",
      category: "misc",
      description: "Posts a rainbow divider line"
    }
    let props = {}

    super(
      client,
      {...comprops},
      {...props}
    )
  }

  async execute(client, interaction) {
    // Defer reply
    interaction.deferReply()
    // Delete interaction
    interaction.deleteReply()

    // Create the embed with the rainbow divider line image
    interaction.channel.send(
      {
        content: "https://cdn.discordapp.com/attachments/565312923271168000/985473102702071838/divider-line.gif"
      }
    )

    return true
  }
}
