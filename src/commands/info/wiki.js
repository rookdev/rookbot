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
const dbFuncs = require('../../utils/db/dbFuncs')

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
      platforms: ["discord", "stoat"],
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
    const pagename = coptions["pagename"] ?? "Main Page"  // Get the page name
    const wikikey = coptions["wikikey"] ?? "z3rwiki"

    let interwikiDB = {
      z3rwiki: "http://alttp.mymm1.com/wiki/%s"
    }


    let guild = interaction?.guild
    let interwikiFile = null
    let messages = []
    let newMessages = []
    if (guild) {
      let dbRes = await dbFuncs.getDB(
        guild.id,
        "interwiki"
      )
      interwikiFile = dbRes[0]
      this.messages.push(...dbRes[1])

      if (interwikiFile) {
        interwikiDB = interwikiFile
      }
    }

    let pattern = interwikiDB[wikikey]
    let transPagename = pagename.replaceAll(" ", "_")
    let wikiurl = pattern.replace("%s", transPagename)
    let content = wikiurl

    this.null = true
    if (typeof interaction.editReply === "function") {
      await interaction.editReply(
        {
          content: content
        }
      )
    } else {
      interaction.reply(content)
    }

    return false
  }
}
