// @ts-nocheck

// Command Option Types
/**
 * Discord Stuff
 *  Command Option Types
 *  Formatters
 *   codeBlock
 */
const { ApplicationCommandOptionType, codeBlock } = require('discord.js')
// Base Rook Command
const { RookCommand } = require('../../classes/command/rcommand.class')
const fileFuncs = require('../../utils/fs/fileFuncs')

module.exports = class WikiCommand extends RookCommand {
  constructor(client) {
    let comprops = {
      name: "wiki",
      category: "info",
      description: "Links to a wikipage",
      options: [
        {
          name: "pagename",
          description: "The Page Name to link to",
          type: ApplicationCommandOptionType.String,
          required: true
        },
        {
          name: "wikikey",
          description: "The Wiki to link to",
          type: ApplicationCommandOptionType.String
        }
      ],
      testOptions: [
      ]
    }
    let props = {
      title: {
        text: "WikiLinks"
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
    // Delete interaction
    await interaction.deleteReply()

    const pagename = coptions["pagename"] ?? "Main Page"  // Get the page name
    const wikikey = coptions["wikikey"] ?? "z3rwiki"

    let interwikiDB = {
      z3rwiki: "http://alttp.mymm1.com/wiki/%s"
    }


    let guild = interaction?.guild
    if (guild) {
      let interwikiFile = fileFuncs.getAFile(
        [
          "src",
          "dbs",
          guild.id
        ],
        "interwiki.json"
      )
      if (interwikiFile) {
        interwikiDB = interwikiFile
      }
    }

    let pattern = interwikiDB[wikikey]
    let transPagename = pagename.replace(" ", "_")
    let wikiurl = pattern.replace("%s", transPagename)
    let content = wikiurl

    // Create the embed with the rainbow divider line image
    await interaction.channel.send(
      {
        content: content
      }
    )

    return false
  }
}
