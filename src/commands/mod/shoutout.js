// @ts-nocheck

// Formatters: inlineCode
const { inlineCode, hyperlink, userMention, ApplicationCommandOptionType } = require('discord.js')
// ModCommand
const { ModCommand } = require('../../classes/command/modcommand.class')
// Rook-branded Embed
const { RookEmbed } = require('../../classes/embed/rembed.class')
const fileFuncs = require('../../utils/fs/fileFuncs')
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

    let content = `Check out ${mention} ${hyperlink('here', streamURL)}!`

    await interaction.channel.send(
      {
        content: content
      }
    )

    return true
  }
}
