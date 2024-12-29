// @ts-nocheck

// Command Option Types
const { ApplicationCommandOptionType } = require('discord.js')
// Base Rook Command
const { RookCommand } = require('../../classes/command/rcommand.class.js')
// Use Discord Hammertime
const timeFormat = require('../../utils/timeFormat.js')
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
      category: "bot",
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
      `***Guilds that ${client.user} is in:***`,
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
      let owner = await guildData.members.fetch(guildData.ownerId)
      if (owner?.user) {
        owner = owner.user
      }
      // Get Guild Bot
      let bot = await guildData.members.fetch(client.user.id)
      let botJoinedDateTime = new Date(bot.joinedTimestamp)
      // Get Guild Data
      sorted[bot.joinedTimestamp] = {
        // Guild Name & ID
        guild: {
          name: guildData.name,
          id: guildID
        },
        // Owner Username & ID
        owner: {
          tag: owner.user.tag,
          id: owner.id
        },
        // Get Joined DateTime
        added: botJoinedDateTime.toLocaleString(),
        addedTimestamp: Math.floor(bot.joinedTimestamp / 1000),
        addedHammertime: timeFormat(botJoinedDateTime.getTime())
      }
    }

    console.log("")
    console.log("---")

    let plural = "server" + ((Object.keys(sorted).length != 1) ? "s" : "")
    console.log(`${client.user.username}#${client.user.discriminator} (ID:${client.user.id}) is on ${Object.keys(sorted).length} ${plural}!`)

    const Table = new AsciiTable("", {})
      .setHeading("Type","Name","ID")

    // Cycle through guilds
    for (let [guildID, guildData] of Object.entries(ksort(sorted))) {
      if (guildData?.guild) {
        // Get Guild Tier Level
        let tier = guildData.guild.premiumTier
        if (!tier) { tier = 0 }
        Table.addRow("Guild",guildData.guild.name,`(ID:\'${guildData.guild.id}\')`)
          .addRow("Owner",`\'${guildData.owner.tag}\'`,`(ID:\'${guildData.owner.id}\')`)
          .addRow("Added",guildData.added)
          .addRow("Tier",tier)
          .addRow("")
        this.props.description.push(
          `**Guild:** ${guildData.guild.name} (ID:\`${guildData.guild.id}\`)`,
          `**Owner:** \`${guildData.owner.username}#${guildData.owner.discriminator}\` (ID:\`${guildData.owner.id}\`, <@${guildData.owner.id}>)`,
          `**Added:** ${guildData.addedHammertime}`,
          `**Tier:** ${tier}`,
          ""
        )
      }
    }
    console.log(Table.toString())

    return !this.error
  }
}
