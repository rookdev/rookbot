// @ts-nocheck

// Base Rook Command
const { RookCommand } = require('../../classes/command/rcommand.class')
const fileFuncs = require('../../utils/fs/fileFuncs')

module.exports = class MothCommand extends RookCommand {
  constructor(client) {
    let comprops = {
      name: "moth",
      category: "doi",
      description: "Hear it from the legend himself",
      flags: {
        test: "basic"
      }
    }
    let props = {}

    super(
      client,
      {...comprops},
      {...props}
    )
  }

  // declare props: import('../../types/embed').EmbedProps

  async action(client, interaction, coptions={}) {
    // Path to the local video file
    const videoPath = fileFuncs.getAPath(
      [
        "src",
        "res",
        "media"
      ],
      "mothula.mp4"
    )

    try {
      // Send the video to the channel the command was sent in
      await interaction?.editReply({
        files: [videoPath]
      })
      this.null = true
    } catch (error) {
      this.error = true
      this.props.description = "There was an error uploading the video."
      this.messages.push(`There was an error when uploading the video: ${error.stack}`)
      return false
    }

    return !this.error
  }
}
