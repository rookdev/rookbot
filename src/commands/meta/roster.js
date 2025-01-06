// @ts-nocheck

// Command Option Types, Formatters: inlineCode, bold, italic
const { ApplicationCommandOptionType, inlineCode, bold, italic } = require('discord.js')
// Base Rook Command
const { RookCommand } = require('../../classes/command/rcommand.class')
const path = require('path')  // Easy filepath management
const fs = require('fs')      // Filesystem manipulation

module.exports = class RosterCommand extends RookCommand {
  constructor(client) {
    let comprops = {
      name: "roster",
      category: "meta",
      description: "Display a Roster",
      flags: { target: "required" },
      options: [
        {
          name: "section-type",
          description: "Roster Section",
          type: ApplicationCommandOptionType.String
        },
        {
          name: "guild-id",
          description: "Target Guild",
          type: ApplicationCommandOptionType.String
        }
      ],
      testOptions: [
        {},
        { "guild-id": "1282788953052676177" },
        { "guild-id": "1297216081110372474" },
        { "guild-id": "1303864272832565268" },
        { "guild-id": "745409743593406634" }
      ]
    }
    let props = {
      title: {
        text: "Roster Viewer"
      }
    }

    super(
      client,
      {...comprops},
      {...props}
    )
  }

  // declare props: import('../../types/embed').EmbedProps

  async action(client, interaction, coptions) {
    // Get Section Type
    const sectionType = coptions["section-type"]
    // Get Guild ID
    const guildID = coptions["guild-id"] ?? interaction?.guild?.id ?? process.env.GUILD_ID

    // Get Guild IDs path
    const guildIDsPath = path.join(
      __dirname,
      "..",
      "..",
      "dbs",
      "rosters",
      "guilds.json"
    )
    if (!guildIDsPath) {
      this.error = true
      this.props.description = "Bad Roster Guild IDs Path"
      return false
    }

    // Get Guild IDs list
    const guildIDs = require(guildIDsPath)
    if (!guildIDs) {
      this.error = true
      this.props.description = "Couldn't load Roster Guild IDs"
      return false
    }

    // Get profile for this Guild
    const guild = await client.guilds.cache.find(
      g => g.id === guildID
    )
    if (!guild) {
      this.error = true
      this.props.description = `${this.profile.emojis.fail} Couldn't load Guild ID ${inlineCode(guildID)}`
      return false
    }

    // Get roster set to load
    const guildSet = guildIDs[guildID]?.set
    if (!guildSet) {
      this.error = true
      this.props.description = `Couldn't load Guild Set for ${italic(guild.name)} [${inlineCode(guild.id)}]`
      return false
    }

    // Get roster root
    let rostersRoot = path.join(
      __dirname,
      "..",
      "..",
      "dbs",
      "rosters"
    )
    // Cycle through teams for this set
    for (let teamDir of fs.readdirSync(path.join(
      rostersRoot,
      guildSet
    ))) {
      // Cycle through rosters for this team
      for (let rosterFile of fs.readdirSync(path.join(
        rostersRoot,
        guildSet,
        teamDir
      ))) {
        const roster = require(path.join(
          rostersRoot,
          guildSet,
          teamDir,
          rosterFile
        ))

        // If we've got an avatar, set it
        if (roster?.avatar) {
          this.props.playerTypes = {
            user: "bot",
            target: "team"
          }
          this.props.entities = {
            team: {
              name: `${roster.title} Roster`,
              avatar: roster.avatar
            }
          }
        }

        // Set the stripe color
        this.props.color = roster.stripe
        // Set the title
        this.props.title = {
          text: `${roster.title} Roster`
        }

        this.props.description = []
        // Cycle through sections
        for (let [section, sData] of Object.entries(roster.members)) {
          // Add the section title
          this.props.description.push(bold(sData.title))
          // Cycle through users
          for (let username of sData.users) {
            // Try to get the Guild Member
            let member = await guild.members.cache.find(
              g => g.user.username === username
            )
            if (!member) {
              let query = await guild.members.fetch(
                {
                  query: username,
                  limit: 1
                }
              )
              if (query) {
                member = query.first()
              }
            }
            // If we succeeded in getting the Guild Member
            //  Print the link tag
            //  Else, just print the username
            username = member ? `${member}` : italic(username)
            this.props.description.push(username)
          }
          this.props.description.push("")
        }
      }
    }

    return !this.error
  }
}
