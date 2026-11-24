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

module.exports = class GuildStatusCommand extends RookCommand {
  constructor(client) {
    let comprops = {
      name: "status",
      description: "Guild Status",
      flags: {
        domain: [
          "guild"
        ]
      },
      playerTypes: {
        user:   "bot",
        target: "guild"
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

    let serverLevel = guild?.premiumTier

    this.props.title.text = `Guild Status for ${guild.name}`
    this.props.description = []

    // Guild Description
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

    // List Boosts options
    let subCount = guild?.premiumSubscriptionCount
    let guildFeatures = await fileFuncs.getAFile(
      [
        "src",
        "dbs"
      ],
      "guildFeatures.json"
    )

    if (guildFeatures) {
      let perksByLevel  = {}
      let perksBySpent  = {}
      let levelIcon     = "⭐"
      let spentIcon     = "🌟"

      let spent = 0
      if (serverLevel) {
        if (serverLevel >= 1) {
          spent += 2
        }
        if (serverLevel >= 2) {
          spent += 5
        }
        if (serverLevel >= 3) {
          spent += 7
        }
      }

      let hasGuildTags = false
      for (let [flag, label] of Object.entries(guildFeatures)) {
        if (flag.startsWith("!SERVER_LEVEL")) {
          if (flag.endsWith("1") && (serverLevel >= 1)) {
            continue
          } else if (flag.endsWith("2") && (serverLevel >= 2)) {
            continue
          } else if (flag.endsWith("3") && (serverLevel >= 3)) {
            continue
          }
        }
        if (label.contains(levelIcon)) {
          let perkLevel = label.split(levelIcon).length - 1
          if (!(perkLevel in perksByLevel)) {
            perksByLevel[perkLevel] = []
          }
          perksByLevel[perkLevel].push(flag)
        } else if (label.contains(spentIcon)) {
          let perkSpent = label.split(spentIcon).length - 1
          if (!(perkSpent in perksBySpent)) {
            perksBySpent[perkSpent] = []
          }
          let hasPerk = false
          if (guild?.features?.length > 0) {
            if (guild.features.includes(flag)) {
              hasPerk = true
              spent += perkSpent
              if (flag == "GUILD_TAGS") {
                hasGuildTags = true
              }
            }
          }
          let pushPerk = !hasPerk
          if (flag.startsWith("GUILD_TAGS_") && (!hasGuildTags)) {
            pushPerk = false
          }
          if (pushPerk) {
            perksBySpent[perkSpent].push(flag)
          }
        }
      }

      let unspent     = subCount - spent
      let spendables  = `Spendables (${spent}/${unspent}/${subCount})`
      this.props.description.push(bold(spendables))
      for (let [spend, perks] of Object.entries(perksBySpent)) {
        if (globalFuncs.empty(perks)) { continue }
        this.props.description.push(codeBlock(spend + ": " + perks.join(", ")))
      }
      this.props.description.push("")
    }

    this.props.fields = []

    this.props.fields.push(
      [
        {
          name: "Guild",
          value: mentionFuncs.guildMention(guild.name, guild.id, { showID: true })
        }
      ]
    )

    // Creation DateTime
    let createdDateTime = moment.utc(guild.createdTimestamp)
    this.props.fields.push(
      [
        {
          name: "Created",
          value: timeFormat(createdDateTime.format("x"), { with: "relative" })
        }
      ]
    )

    this.props.image = { image: await guild.iconURL({ size: 256 }) }
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

      let owner = await guild.fetchOwner()
      if (owner && owner.partial) {
        owner = await owner.fetch()
      }
      if (owner?.user?.primaryGuild?.identityGuildId == guild.id) {
        let clanGuild = owner.user.primaryGuild
        this.props.fields.push(
          [
            // Clan Guild Tag
            {
              name: "Clan Tag",
              value: codeBlock(clanGuild.tag)
            },
            // Clan Guild Icon
            {
              name: "Clan Icon",
              value: hyperlink("Link", await owner.user.guildTagBadgeURL({ size: 128 }))
            }
          ]
        )
        this.props.playerTypes.target = "target"
        this.props.entities.target = {
          avatar: await owner.user.guildTagBadgeURL({ size: 128 })
        }
      }
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
          value: guild.afkChannel ? `${guild.afkChannel}` : client.profile.emojis.no
        }
      ]
    )
    this.props.fields.push(
      [
        {
          name: "Public Updates Channel",
          value: guild.publicUpdatesChannel ? `${guild.publicUpdatesChannel}` : client.profile.emojis.no
        },
        {
          name: "Rules Channel",
          value: guild.rulesChannel ? `${guild.rulesChannel}` : client.profile.emojis.no
        },
        {
          name: "Safety Alerts Channel",
          value: guild.safetyAlertsChannel ? `${guild.safetyAlertsChannel}` : client.profile.emojis.no
        }
      ],
      [
        {
          name: "System Channel",
          value: guild.systemChannel ? `${guild.systemChannel}` : client.profile.emojis.no
        },
        {
          name: "Widget Channel",
          value: guild.widgetChannel ? `${guild.widgetChannel}` : client.profile.emojis.no
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
