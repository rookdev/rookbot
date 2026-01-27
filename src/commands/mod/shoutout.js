// @ts-nocheck

// Formatters: inlineCode
const { inlineCode, hyperlink, userMention, ApplicationCommandOptionType } = require('discord.js')
// ModCommand
const { ModCommand } = require('../../classes/command/modcommand.class')
const SayCommand = require('../../commands/botdo/say')
// Rook-branded Embed
const { RookEmbed } = require('../../classes/embed/rembed.class')
const fileFuncs = require('../../utils/fs/fileFuncs')
const randFuncs = require('../../utils/primitives/randFuncs')
const dbFuncs = require('../../utils/db/dbFuncs')

module.exports = class ShoutoutCommand extends ModCommand {
  constructor(client) {
    let comprops = {
      name: "shoutout",
      category: "mod",
      description: "Post a Shoutout for a user.",
      options: [
        {
          name: "target-id",
          description: "User to shoutout",
          type: ApplicationCommandOptionType.String,
          required: true
        },
        {
          name: "stream-url",
          description: "Stream URL",
          type: ApplicationCommandOptionType.String,
          required: true
        }
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
    let targetInput = coptions["target-id"]
    let streamURL = coptions["stream-url"]
    // Get Target ID
    let targetId = targetInput.replace(/[<#@&!>]/g, '')  // Remove <@>, <@!>, and >
    let mention = userMention(targetId)

    let content = `Check out ${mention} ${hyperlink('here', streamURL)} !`
    let dbRes = await dbFuncs.getDB(interaction.guild.id, "visages")
    let visages = dbRes[0]
    let messages = dbRes[1]
    let visageName = ""
    let visage = null
    if (Object.keys(visages).includes("scuff")) {
      visageName = "scuff"
    } else {
      visageName = Object.keys(visages)[0]
    }
    visage = visages[visageName]

    if (visage.quips) {
      content += " " + randFuncs.randPick(visage.quips)
    }

    let sayCmd = new SayCommand(client)
    sayCmd.null = true
    let result = await sayCmd.build(
      client,
      interaction,
      {
        message: content,
        "visage-name": visageName
      }
    )

    return true
  }
}
