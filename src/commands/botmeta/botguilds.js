// @ts-nocheck

// Command Option Types, Formatters: inlineCode, bold, userMention
const { ApplicationCommandOptionType, inlineCode, bold, userMention } = require('discord.js')
// Base Rook Command
const { RookCommand } = require('../../classes/command/rcommand.class')
const mentionFuncs = require('../../utils/formatters/mentions')
const stringFuncs = require('../../utils/primitives/stringFuncs')
const globalFuncs = require('../../utils/primitives/globalFuncs')
// Use Discord HammerTime
const timeFormat = require('../../utils/formatters/timeFormat')
const AsciiTable = require('ascii-table') // Pretty-print to console
const getters = require('../../utils/guild/getters')
const moment = require('moment')

// Sort by keys
function ksort(obj){
  let keys = Object.keys(obj).sort(), sortedObj = {}

  for(let i in keys) {
    sortedObj[keys[i]] = obj[keys[i]]
  }

  return sortedObj
}

module.exports = class BotGuildsCommand extends RookCommand {
  constructor(client) {
    let comprops = {
      name: "botguilds",
      category: "botmeta",
      description: "Bot Guilds",
      flags: {
        user: "unapplicable",
        test: "basic"
      },
      options: [
        {
          name: "locale",
          description: "Locale",
          type: ApplicationCommandOptionType.String
        }
      ]
    }
    let props = {
      title: { text: "Bot Guilds" }
    }
    super(
      client,
      {...comprops},
      {...props}
    )
  }

  // declare props: import('../../types/embed').EmbedProps

  async action(client, interaction, coptions={}) {
    // Set EmbedPlayerTypes to Bot|Bot
    this.props.playerTypes = {
      user: "bot",
      target: "bot"
    }

    // Get Guilds
    let guilds = await this.getProp(client, client, "guilds")
    let locale = coptions['locale']
    if (!locale) {
      locale = "en-AU"
    }

    let totalMembers = 0
    let sorted = []

    // Cycle through guilds
    for (let [guildID, guildData] of guilds.cache) {
      // Add Members Number
      totalMembers += guildData.memberCount

      // Get Guild Owner
      let owner = globalFuncs.isStoat(client) ? await guildData.owner : await guildData.fetchOwner()
      if (await this.getProp(client, owner, "user")) {
        owner = await this.getProp(client, owner, "user")
      }
      // Get Guild Bot
      let bot = await this.getCache(client, guildData, "members", client.user.id)
      let botJoinedDateTime = moment.utc(bot.joinedTimestamp)
      // Get Guild Data
      let thisGuild = {}
      thisGuild.guild = {
        name: guildData.name,
        id: guildID
      }
      if (owner) {
        thisGuild.owner = {
          username: owner.username,
          id: owner.id
        }
      }
      thisGuild.added = botJoinedDateTime.toLocaleString()
      thisGuild.addedTimestamp = Math.floor(bot.joinedTimestamp / 1000)
      thisGuild.addedHammertime = timeFormat(botJoinedDateTime.format("x"), { with: "relative" })
      sorted[bot.joinedTimestamp] = thisGuild
    }

    this.props.description = []
    this.props.description.push(
      `${client.user} is servicing ${totalMembers} members in ${Object.keys(sorted).length} guilds:`.boldItalic(),
      ""
    )

    this.messages.push("")
    this.messages.push("---")

    let plural = "server".pluralize(Object.keys(sorted).length)
    this.messages.push(`${client.user.username}#${client.user.discriminator} (ID:${client.user.id}) is on ${Object.keys(sorted).length} ${plural}!`)

    const Table = new AsciiTable("", {})
      .setBorder('|','-','•','•')
      .setHeading("Type","Name","ID")

    // Cycle through guilds
    for (let [guildID, guildData] of Object.entries(ksort(sorted))) {
      if (guildData?.guild) {
        // Get Guild Tier Level
        let tier = guildData.guild.premiumTier ?? 0
        // Get Guild Server Boosts
        let boosts = guildData.guild.premiumSubscriptionCount ?? 0
        Table.addRow("Guild",guildData.guild.name,`(ID:\'${guildData.guild.id}\')`)
          .addRow("Owner",  `\'${guildData.owner.username}\'`,`(ID:\'${guildData.owner.id}\')`)
          .addRow("Added",  guildData.added)
          // .addRow("Tier",   tier)
          // .addRow("Boosts", boosts)
          .addRow("")
        this.props.description.push(
          bold(`Guild:`)  + ` ${mentionFuncs.guildMention(guildData.guild.name, guildData.guild.id, { showID: true, oneLine: true })}`,
          bold(`Owner:`)  + ` ${inlineCode(guildData.owner.username)} [${inlineCode(guildData.owner.id)}, ${mentionFuncs.userMention(guildData.owner.id)}]`,
          bold(`Added:`)  + ` ${guildData.addedHammertime}`,
          // bold(`Tier:`)   + ` ${tier}`,
          // bold(`Boosts:`) + ` ${boosts}`,
          ""
        )
      }
    }
    this.messages.push(Table.toString())

    return !this.error
  }
}
