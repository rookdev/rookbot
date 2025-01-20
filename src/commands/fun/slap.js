// @ts-nocheck

const { ApplicationCommandOptionType, userMention, italic } = require("discord.js")
// AdminCommand
const { AdminCommand } = require("../../classes/command/admincommand.class")

module.exports = class SlapCommand extends AdminCommand {
  constructor(client) {
    let comprops = {
      name: "slap",
      category: "fun",
      description: "Slap another user around with a specified item",
      flags: {
        test: "basic"
      },
      options: [
        {
          name: "target-id",
          description: "ID of target",
          type: ApplicationCommandOptionType.String,
          required: true
        },
        {
          name: "item",
          description: "Item to slap with",
          type: ApplicationCommandOptionType.String
        },
        {
          name: "distance",
          description: "How far to slap",
          type: ApplicationCommandOptionType.String
        }
      ],
      aliases: [
        {
          name: "trout",
          description: "Slap another user around a bit with a large trout",
          options: { "distance": "a bit", "item": "a large trout" }
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

  async action(client, interaction, coptions={}) {
    let distance      = coptions.distance ?? "a bit"
    let item          = coptions.item ?? "a large trout"
    // Get Target Input
    let targetInput   = coptions["target-id"]
    // Get Target ID
    let targetId      = targetInput.replace(/[<#@&!>]/g, '')  // Remove <@>, <@!>, and >

    this.props.description = italic(`${interaction.user} slaps ${userMention(targetId)} around ${distance} with ${item}`)

    return !this.error
  }
}
