// @ts-nocheck

// Command Option Types, Formatters: inlineCode, bold, userMention
const { ApplicationCommandOptionType, inlineCode, bold, userMention } = require('discord.js')
// Base Rook Command
const { RookCommand } = require('../../classes/command/rcommand.class')
// Use Discord HammerTime
const timeFormat = require('../../utils/formatters/timeFormat')
const AsciiTable = require('ascii-table') // Pretty-print to console

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

    this.props.description = []
    this.props.description.push(
      `Guilds that ${client.user} is in:`.boldItalic(),
      ""
    )

    // Get Guilds
    let guilds = client.guilds.cache
    let locale = coptions['locale']
    if (!locale) {
      locale = "en-AU"
    }

    let sorted = []

    // Cycle through guilds
    for (let [guildID, guildData] of guilds) {
      // Get Guild Owner
      let owner = await guildData.fetchOwner()
      if (owner?.user) {
        owner = owner.user
      }
      // Get Guild Bot
      let bot = await guildData.members.fetch(client.user.id)
      let botJoinedDateTime = new Date(bot.joinedTimestamp)
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
      thisGuild.addedHammertime = timeFormat(botJoinedDateTime.getTime())
      sorted[bot.joinedTimestamp] = thisGuild
    }

    console.log("")
    console.log("---")

    let plural = "server" + ((Object.keys(sorted).length != 1) ? "s" : "")
    console.log(`${client.user.username}#${client.user.discriminator} (ID:${client.user.id}) is on ${Object.keys(sorted).length} ${plural}!`)

    const Table = new AsciiTable("", {})
      .setBorder('|','-','•','•')
      .setHeading("Type","Name","ID")

    // Cycle through guilds
    for (let [guildID, guildData] of Object.entries(ksort(sorted))) {
      if (guildData?.guild) {
        // Get Guild Tier Level
        let tier = guildData.guild.premiumTier
        if (!tier) { tier = 0 }
        Table.addRow("Guild",guildData.guild.name,`(ID:\'${guildData.guild.id}\')`)
          .addRow("Owner",`\'${guildData.owner.username}\'`,`(ID:\'${guildData.owner.id}\')`)
          .addRow("Added",guildData.added)
          .addRow("Tier",tier)
          .addRow("")
        this.props.description.push(
          bold(`Guild:`) + ` ${guildData.guild.name} [${inlineCode(guildData.guild.id)}]`,
          bold(`Owner:`) + ` ${inlineCode(guildData.owner.username)} [${inlineCode(guildData.owner.id)}, ${userMention(guildData.owner.id)}]`,
          bold(`Added:`) + ` ${guildData.addedHammertime}`,
          bold(`Tier:`) + ` ${tier}`,
          ""
        )
      }
    }
    console.log(Table.toString())

    return !this.error
  }
}
