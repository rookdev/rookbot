// @ts-nocheck

const { ApplicationCommandOptionType, userMention, italic } = require("discord.js")
// AdminCommand
const { RookCommand } = require("../../classes/command/rcommand.class")
const mentionFuncs = require('../../utils/formatters/mentions')

module.exports = class SlapCommand extends RookCommand {
  constructor(client) {
    let comprops = {
      name: "slap",
      category: "fun",
      description: "Slap another user around with a specified item",
      flags: {
        test: "basic",
        domain: [
          "guild"
        ]
      },
      options: [
        {
          name: "target",
          description: "ID of target",
          type: ApplicationCommandOptionType.User,
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
      playerTypes: {
        user:   "caller",
        target: "target"
      },
      platforms: ["discord", "stoat"],
      testOptions: [
        { "target": "1306491719717748830" },
        { "target": "1306491719717748830", "item": "a sledgehammer" },
        { "target": "1306491719717748830", "distance": "a fair bit" }
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
    let targetInput   = coptions["target"]
    // Get Target ID
    let targetId      = targetInput?.replace(/[<#@&!>]/g, '')  // Remove <@>, <@!>, and >

    let interactionGuild = await this.getGuild(client, interaction)

    let user = await this.getProp(client, interaction, "user")
    this.props.description = italic(`${user} slaps ${mentionFuncs.userMention(targetId)} around ${distance} with ${item}`)
    let target = await this.getCache(client, interactionGuild, "members", targetId)
    if (target) {
      let avatar = await target.displayAvatarURL( { size: 128 })
      this.props.entities.target = { avatar }
    }

    return !this.error
  }
}
