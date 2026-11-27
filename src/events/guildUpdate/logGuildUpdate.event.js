// @ts-nocheck

const { GuildMember, Guild, bold, hyperlink, italic, inlineCode, codeBlock } = require('discord.js')
const { EventScript } = require('../../classes/event/eventscript.class')
const { RookClient } = require('../../classes/objects/rclient.class')
const mentionFuncs = require('../../utils/formatters/mentions')
const globalFuncs = require('../../utils/primitives/globalFuncs')
const timeFormat = require('../../utils/formatters/timeFormat')
const moment = require('moment')

/**
 * @class
 * @this {LogGuildUpdateEvent}
 * @public
 */
module.exports = class LogGuildUpdateEvent extends EventScript {
  constructor(client) {
    let evtprops = {
      name: "logGuildUpdate",
      event: "guildUpdate",
      label: "Guild Update",
      description: "Log to a channel and to disk when guild is updated"
    }
    super(
      client,
      {...evtprops}
    )
  }

  /**
   * 
   * @param {RookClient} client 
   * @param {Guild} oldGuild 
   * @param {Guild} newGuild 
   * @returns 
   */
  async action(client, oldGuild, newGuild) {
    // this.messages.push(`/${this.name}: Event Action`)
    if (![
      "1303864272832565268",  // Rookbot Development
      "1300236759606497310"   // Yuki TV
    ].includes(newGuild.id)) {
      return false
    }

    let logProps = {}
    logProps.color = client.profile.colors.info
    logProps.title = {
      text: "[Log] Guild Updated",
      emoji: ""
    }
    logProps.entities = {
      guild: {
        name: newGuild.name,
        avatar: newGuild.iconURL({ size: 128 })
      }
    }
    logProps.playerTypes = {
      user:   "guild",
      target: "guild"
    }

    logProps.description = []
    logProps.fields = []
    // Description
    if (oldGuild.description != newGuild.description) {
      logProps.description.push(bold("Description"))
      logProps.description.push(codeBlock(newGuild.description))
    }
    // Features
    if (oldGuild.features != newGuild.features) {
      let oldFeatures     = oldGuild.features.sort()
      let newFeatures     = newGuild.features.sort()

      // Added: Not in old, in new
      let addedFeatures   = newFeatures.filter(v => !oldFeatures.includes(v))
      // Removed: In old, not in new
      let removedFeatures = oldFeatures.filter(v => !newFeatures.includes(v))

      let hasAdded        = !globalFuncs.empty(addedFeatures)
      let hasRemoved      = !globalFuncs.empty(removedFeatures)

      if (hasAdded || hasRemoved) {
        logProps.description.push(bold("Features"))
        if (hasAdded) {
          logProps.description.push(italic("Added"))
          logProps.description.push(codeBlock(addedFeatures.join(", ")))
        }
        if (hasRemoved) {
          logProps.description.push(italic("Removed"))
          logProps.description.push(codeBlock(removedFeatures.join(", ")))
        }
      }
    }

    // Fields
    // Name
    if (oldGuild.name != newGuild.name) {
      logProps.fields.push(
        [
          {
            name: "Old Name",
            value: oldGuild.name
          },
          {
            name: "New Name",
            value: newGuild.name
          }
        ]
      )
    }

    // Owner
    if (oldGuild.ownerId != newGuild.ownerId) {
      let oldOwner = await this.getCache(client, oldGuild, "members", oldGuild.ownerId)
      let newOwner = await this.getCache(client, newGuild, "members", newGuild.ownerId)
      logProps.fields.push(
        [
          {
            name: "Old Owner",
            value: oldOwner ? mentionFuncs.userMention(oldOwner.id, { showID: true }) : "???"
          },
          {
            name: "New Owner",
            value: newOwner ? mentionFuncs.userMention(newOwner.id, { showID: true }) : "???"
          }
        ]
      )
    }

    // Boosts
    if (oldGuild.premiumSubscriptionCount != newGuild.premiumSubscriptionCount) {
      logProps.fields.push(
        [
          {
            name: "Old Boosts",
            value: oldGuild.premiumSubscriptionCount
          },
          {
            name: "New Boosts",
            value: newGuild.premiumSubscriptionCount
          }
        ]
      )
    }

    // Boost Bar
    if (oldGuild.premiumProgressBarEnabled != newGuild.premiumProgressBarEnabled) {
      logProps.fields.push(
        [
          {
            name: "Old Boost Bar",
            value: oldGuild.premiumProgressBarEnabled ? client.profile.emojis.yes : client.profile.emojis.no
          },
          {
            name: "New Boost Bar",
            value: newGuild.premiumProgressBarEnabled ? client.profile.emojis.yes : client.profile.emojis.no
          }
        ]
      )
    }

    // Vanity Invite URL
    if (oldGuild.vanityURLCode !== newGuild.vanityURLCode) {
      logProps.fields.push(
        [
          {
            name: "Old Vanity URL",
            value: oldGuild?.vanityURLCode ? hyperlink(
              inlineCode(oldGuild.vanityURLCode),
              `http://discord.gg/${oldGuild.vanityURLCode}`
            ) :
            client.profile.emojis.no
          },
          {
            name: "New Vanity URL",
            value: newGuild?.vanityURLCode ? hyperlink(
              inlineCode(newGuild.vanityURLCode),
              `http://discord.gg/${newGuild.vanityURLCode}`
            ) :
            client.profile.emojis.no
          }
        ]
      )
    }

    // console.log(logProps)

    // client
    // guild
    // logging-<this> guildchannel key
    // embed props
    await this.logPost(
      client,
      newGuild,
      "guild",
      logProps
    )

    let logLines = []

    logLines.push(`Guild:    ${newGuild.name} (ID: ${newGuild.id})`)
    // client
    // data
    // <region><this>.log
    await this.logFile(
      client,
      logLines,
      "guild"
    )

    // appended messages for debugging
    await this.logMessages(
      "",
      {
        guild: newGuild.name,
        action: "guildUpdate"
      }
    )
  }
}
