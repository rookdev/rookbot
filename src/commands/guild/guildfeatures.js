// @ts-nocheck

// Formatters: codeBlock, inlineCode, bold, userMention
const { codeBlock, inlineCode, bold, hyperlink } = require('discord.js')
// Base Rook Command
const { RookCommand } = require('../../classes/command/rcommand.class')
const mentionFuncs = require('../../utils/formatters/mentions')
const globalFuncs = require('../../utils/primitives/globalFuncs')
// Use Discord HammerTime
const timeFormat = require('../../utils/formatters/timeFormat')
const fileFuncs = require('../../utils/fs/fileFuncs')
const moment = require('moment')

module.exports = class GuildFeaturesCommand extends RookCommand {
  constructor(client) {
    let comprops = {
      name: "guildfeatures",
      category: "guild",
      description: "Guild Features",
      flags: {
        test: "basic"
      },
      platforms: ["discord"]
    }
    let props = {
      title: {
        text: "Guild Features"
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

    this.props.title.text = `Guild Features for ${guild.name}`
    this.props.description = []

    // List Guild Features
    if (guild?.features?.length > 0) {
      let features = guild.features.sort()
      let featureDescs = fileFuncs.getAFile(["src","dbs"],"guildFeatures.json")
      this.props.description.push(bold("Features"))

      for (let feature of features) {
        let featureDesc = ""
        if (feature in featureDescs) {
          featureDesc = featureDescs[feature]
          if (featureDesc == "") {
            featureDesc = feature.split("_").map(
              f => f.toLowerCase().ucfirst()
            ).join(" ")
          }
        }

        if (featureDesc.contains("❌")) {
          featureDesc = ""
        }

        if (featureDesc != "") {
          this.props.description.push(inlineCode(feature))
          this.props.description.push(
            client.profile.emojis.null.repeat(2) +
            featureDesc
          )
        }
      }
      this.props.description.push("")
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
      ]
    )

    return !this.error
  }
}
