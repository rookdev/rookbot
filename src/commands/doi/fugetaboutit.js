// @ts-nocheck

const { AttachmentBuilder } = require('discord.js')
// Base Rook Command
const { RookCommand } = require('../../classes/command/rcommand.class')
const fileFuncs = require('../../utils/fs/fileFuncs')
const fs = require('fs')

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
    try {
      await interaction.deferReply()
      let vidData = await fileFuncs.getAFile(
        [
          "src",
          "res",
          "media"
        ],
        "fugetaboutit.mp4"
      )
      if (vidData) {
        await interaction.channel.send(
          {
            content: "Fugetaboutit!",
            description: "Fugetaboutit!!",
            files: [
              new AttachmentBuilder()
                .setName("fugetaboutit.mp4")
                .setFile(Buffer.from(vidData))
            ]
          }
        )
      } else {
        console.log("Vid didn't load")
      }
    } catch (error) {
      console.log(error.stack)
      this.error = true
      this.props.description = "Error uploading video"
      return false
    }

    return !this.error
  }
}
