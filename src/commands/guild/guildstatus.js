// @ts-nocheck

// Formatters: codeBlock, inlineCode, bold, userMention
const { codeBlock, inlineCode, bold, hyperlink } = require('discord.js')
// Base Rook Command
const { RookCommand } = require('../../classes/command/rcommand.class')
const mentionFuncs = require('../../utils/formatters/mentions')
const globalFuncs = require('../../utils/primitives/globalFuncs')
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
      },
      platforms: ["discord", "stoat"]
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
    if (globalFuncs.isStoat(client)) {
      serverBoostEmoji = null
    } else {
      // "discord"
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
    if (globalFuncs.isStoat(client)) {
      members = await guild.members.cache
    } else {
      // "discord"
      members = await guild.members.fetch()
    }
    let numMembers = members.size
    let numBots = 0
    if (globalFuncs.isStoat(client)) {
      numBots = 0
    } else {
      // "discord"
      numBots = members?.filter(member=>member.user.bot).size ?? 0
    }

    let maxEmojis         = 50
    let maxStickers       =  5
    let maxSoundboard     =  8
    let emojis            = await guild.emojis.fetch()
    let numStaticEmojis   = emojis?.filter(e=>!e.animated).size ?? 0
    let numAnimatedEmojis = emojis?.filter(e=>e.animated).size  ?? 0
    let stickers          = await guild.stickers.fetch()
    let numStickers       = stickers?.size ?? 0
    let soundboardSounds  = await guild.soundboardSounds.fetch()
    let numSoundboard     = soundboardSounds?.size ?? 0

    let serverLevel = guild.premiumTier
    if (serverLevel >= 1) {
      maxEmojis     = 100
      maxStickers   =  15
      maxSoundboard =  24
      if (serverLevel >= 2) {
        maxEmojis     = 150
        maxStickers   =  30
        maxSoundboard =  36
        if (serverLevel >= 3) {
          maxEmojis     = 250
          maxStickers   =  60
          maxSoundboard =  48
        }
      }
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
          value: serverLevel == 0 ? `${serverLevel}` : `${serverBoostEmoji}`.repeat(serverLevel)
        },
        // Server Boosters
        {
          name: "Server Boosts",
          value: guild?.premiumSubscriptionCount
        }
      ],
      [
        // Static/Animated Emojis
        {
          name: "Static/Animated Emojis",
          value: `${numStaticEmojis}/${numAnimatedEmojis}/${maxEmojis}`
        },
        // Stickers
        {
          name: "Stickers",
          value: `${numStickers}/${maxStickers}`
        },
        // Soundboard
        {
          name: "Soundboard",
          value: `${numSoundboard}/${maxSoundboard}`
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
