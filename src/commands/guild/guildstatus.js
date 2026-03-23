// @ts-nocheck

// Formatters: codeBlock, inlineCode, bold, userMention
const { codeBlock, inlineCode, bold, hyperlink } = require('discord.js')
// Base Rook Command
const { RookCommand } = require('../../classes/command/rcommand.class')
const mentionFuncs = require('../../utils/formatters/mentions')
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
    let guild = await this.getGuild(client, interaction)
    if (!guild) {
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
    let serverBoostEmoji = null
    if (["stoat"].includes(client.platform)) {
      serverBoostEmoji = null
    } else {
      serverBoostEmoji = await this.getCache(client, guild, "emojis", serverBoostEmojiName)
    }
    if (
      !(serverBoostEmoji) ||
      (serverBoostEmoji == serverBoostEmojiName) ||
      (serverBoostEmoji == `[${serverBoostEmojiName}]`)
    ) {
      serverBoostEmoji = "⭐"
    }

    this.props.title.text = `Guild Status for ${guild.name}`
    this.props.description = []

    if (guild.description) {
      this.props.description.push(
        bold("Description"),
        codeBlock(guild.description)
      )
    }

    // List Guild Features
    if (guild?.features?.length > 0) {
      this.props.description.push(
        bold("Features"),
        codeBlock(guild.features.sort().join(", "))
      )
    }

    // Creation DateTime
    let createdDateTime = moment.utc(guild.createdTimestamp)
    this.props.description.push(
      bold("Created"),
      timeFormat(createdDateTime.format("x"), { with: "relative" })
    )

    this.props.fields = []

    if (guild?.ownerId && guild.ownerId != "undefined") {
      // this.messages.push(`Guild Owner: ${guild.ownerId}`)
      this.props.fields.push(
        [
          // Owner
          {
            name: "Owner",
            value: mentionFuncs.userMention(guild.ownerId, { showID: true })
          }
        ]
      )
    }

    // Vanity URL
    if (guild?.vanityURLCode && guild.vanityURLCode != "") {
      let vanityURL = `https://discord.gg/${guild.vanityURLCode}`
      this.props.fields.push(
        [
          {
            name: "Vanity URL",
            value: hyperlink(guild.vanityURLCode, vanityURL)
          }
        ]
      )
    }

    let members = null
    if (["stoat"].includes(client.platform)) {
      members = await guild.members.cache
    } else {
      members = await guild.members.fetch()
    }
    let numMembers = members.size
    let numBots = 0
    if (["stoat"].includes(client.platform)) {
      numBots = 0
    } else {
      numBots = members?.filter(member=>member.user.bot).size ?? 0
    }
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
          value: guild.premiumTier == 0 ? `${guild.premiumTier}` : `${serverBoostEmoji}`.repeat(guild.premiumTier)
        },
        // Server Boosters
        {
          name: "Server Boosters",
          value: guild?.premiumSubscriptionCount
        }
      ],
      [
        // Partnered
        {
          name: "Partnered",
          value: guild.partnered ? this.profile.emojis.check : this.profile.emojis.nocheck
        },
        // Verified
        {
          name: "Verified",
          value: guild.verified ? this.profile.emojis.check : this.profile.emojis.nocheck
        },
        // AFK Channel
        {
          name: "AFK Channel",
          value: guild.afkChannel ? `${guild.afkChannel}` : ""
        }
      ]
    )
    this.props.fields.push(
      [
        {
          name: "Public Updates Channel",
          value: guild.publicUpdatesChannel ? `${guild.publicUpdatesChannel}` : ""
        },
        {
          name: "Rules Channel",
          value: guild.rulesChannel ? `${guild.rulesChannel}` : ""
        },
        {
          name: "Safety Alerts Channel",
          value: guild.safetyAlertsChannel ? `${guild.safetyAlertsChannel}` : ""
        }
      ],
      [
        {
          name: "System Channel",
          value: guild.systemChannel ? `${guild.systemChannel}` : ""
        },
        {
          name: "Widget Channel",
          value: guild.widgetChannel ? `${guild.widgetChannel}` : ""
        },
        {
          name: "Widget Enabled?",
          value: (guild?.widgetEnabled && (guild.widgetEnabled != "null")) ? this.profile.emojis.nocheck : this.profile.emojis.check
        }
      ]
    )

    return !this.error
  }
}
