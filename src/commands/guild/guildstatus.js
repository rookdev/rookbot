// @ts-nocheck

// Formatters: codeBlock, inlineCode, bold, userMention
const { codeBlock, inlineCode, bold, userMention } = require('discord.js')
// Base Rook Command
const { RookCommand } = require('../../classes/command/rcommand.class')
// Use Discord HammerTime
const timeFormat = require('../../utils/formatters/timeFormat')
const moment = require('moment')

module.exports = class GuildStatusCommand extends RookCommand {
  constructor(client) {
    let comprops = {
      name: "guildstatus",
      category: "guild",
      description: "Guild Status",
      flags: {
        test: "basic"
      }
    }
    let props = {
      title: {
        text: "Guild Status"
      }
    }
    super(
      client,
      {...comprops},
      {...props}
    )
  }

  // declare props: import('../../types/embed').EmbedProps

  async action(client, interaction, coptions={}) {
    if (!interaction?.guild) {
      this.error = true
      this.props.description = "Command must be run in guild."
      return false
    }

    // Set EmbedPlayerTypes to Bot|Guild
    this.props.playerTypes = {
      user: "bot",
      target: "guild"
    }

    let serverBoostEmojiName = "serverboost2"
    let serverBoostEmoji = await this.getEmoji(client, interaction, serverBoostEmojiName)
    if (
      !(serverBoostEmoji) ||
      (serverBoostEmoji == serverBoostEmojiName) ||
      (serverBoostEmoji == `[${serverBoostEmojiName}]`)
    ) {
      serverBoostEmoji = "⭐"
    }

    this.props.title.text = `Guild Status for ${interaction.guild.name}`
    // List Guild Features
    if (interaction.guild.features.length > 0) {
      this.props.description = ""
      this.props.description += bold("Features") + "\n"
      this.props.description += codeBlock(interaction.guild.features.sort().join(", "))
    }

    // Creation DateTime
    let createdDateTime = moment(interaction.guild.createdTimestamp)
    this.props.description += "\n\n"
    this.props.description += bold("Created") + "\n"
    this.props.description += timeFormat(createdDateTime.format("X"), { with: "relative" })

    this.props.fields = []

    if (interaction?.guild?.ownerId && interaction.guild.ownerId != "undefined") {
      // console.log(`Guild Owner: ${interaction.guild.ownerId}`)
      this.props.fields.push(
        [
          // Owner
          {
            name: "Owner",
            value: [
              userMention(interaction.guild.ownerId),
              `[${inlineCode(interaction.guild.ownerId)}]`
            ]
          }
        ]
      )
    }

    // Vanity URL
    if (interaction?.guild?.vanityURLCode && interaction.guild.vanityURLCode != "") {
      let vanityURL = `https://discord.gg/${interaction.guild.vanityURLCode}`
      this.props.fields.push(
        [
          {
            name: "Vanity URL",
            value: `[${interaction.guild.vanityURLCode}](${vanityURL})`
          }
        ]
      )
    }

    let members = await interaction.guild.members.fetch()
    let numMembers = members.size
    let numBots = members.filter(member => member.user.bot).size
    this.props.fields.push(
      [
        // Number of Members
        {
          name: "Members",
          value: `${numMembers}`
        },
        // Number of Non-Bots
        {
          name: "Non-Bot Members",
          value: `${numMembers - numBots}`
        },
        // Number of Bots
        {
          name: "Bot Members",
          value: `${numBots}`
        }
      ],
      [
        // Server Level
        {
          name: "Server Level",
          value: interaction.guild.premiumTier == 0 ? `${interaction.guild.premiumTier}` : `${serverBoostEmoji}`.repeat(interaction.guild.premiumTier)
        },
        // Server Boosters
        {
          name: "Server Boosters",
          value: interaction?.guild?.premiumSubscriptionCount
        }
      ],
      [
        // Partnered
        {
          name: "Partnered",
          value: interaction.guild.partnered ? this.profile.emojis.check : this.profile.emojis.nocheck
        },
        // Verified
        {
          name: "Verified",
          value: interaction.guild.verified ? this.profile.emojis.check : this.profile.emojis.nocheck
        }
      ]
    )

    return !this.error
  }
}
