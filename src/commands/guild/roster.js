// @ts-nocheck

// Command Option Types, Formatters: inlineCode, bold, italic
const { ApplicationCommandOptionType, inlineCode, bold, italic } = require('discord.js')
// Base Rook Command
const { RookCommand } = require('../../classes/command/rcommand.class')
const mentionFuncs = require('../../utils/formatters/mentions')
const fileFuncs = require('../../utils/fs/fileFuncs')
const dbFuncs = require('../../utils/db/dbFuncs')
const path = require('path')  // Easy filepath management
const fs = require('fs')      // Filesystem manipulation

module.exports = class RosterCommand extends RookCommand {
  constructor(client) {
    let comprops = {
      name: "roster",
      category: "guild",
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
      platforms: ["discord", "stoat"],
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
    const sectionType = coptions["section-type"] ?? null
    // Get Guild ID
    let interactionGuild = await this.getGuild(client, interaction)
    let guildID = null
    if (coptions["guild-id"]) {
      guildID = coptions["guild-id"]
    } else if (interactionGuild?.id) {
      guildID = interactionGuild.id
    } else {
      guildID = process.env.GUILD_ID
    }

    // Get Guild IDs list
    let guildIDs = fileFuncs.getAFile(
      [
        "src",
        "dbs",
        "rosters"
      ],
      "guilds.json"
    )

    let dbRes = await dbFuncs.getDB("rosters","guilds")
    guildIDs = dbRes[0]
    this.messages.push(...dbRes[1])

    if (!guildIDs) {
      this.error = true
      this.props.description = "Couldn't load Roster Guild IDs"
      return false
    }

    // Get profile for this Guild
    const guild = await this.getCache(client, client, "guilds", guildID)
    if (!guild) {
      this.error = true
      this.props.description = `${this.profile.emojis.fail} Couldn't load Guild ID ${inlineCode(guildID)}`
      return false
    }

    // Get roster set to load
    const guildSet = guildIDs[guildID]?.set
    if (!guildSet) {
      this.error = true
      this.props.description = `Couldn't load Guild Set for ${mentionFuncs.guildMention(guild.name, guild.id, { showID: true, oneLine: true })}`
      return false
    }

    dbRes = await dbFuncs.getDB("rosters","rosters")
    let rosters = dbRes[0]
    this.messages.push(...dbRes[1])

    // Get roster root
    let rostersRoot = fileFuncs.getAPath(
      [
        "src",
        "dbs",
        "rosters"
      ]
    )

    let roster = {}

    if (rosters[guildSet]) {
      this.props.description = []
      this.props.description.push(bold(rosters[guildSet]?.title))
      for (let [deptDir, rosterFile] of Object.entries(rosters[guildSet])) {
        if (deptDir == "title") {
          continue
        }
        let printDir = Object.entries(rosters[guildSet])
          .filter(
            ([r, rData]) =>
              r != "title"
          ).length != 1

        this.props.description.push("")
        this.props.description.push(italic(deptDir.ucfirst()))

        for (let [teamDir, teamFile] of Object.entries(rosterFile)
          .filter(
            ([r, rData]) =>
              typeof rData == "object"
          )
        ) {
          if (printDir) {
            if (sectionType) {
              printDir = (sectionType != teamDir)
            }
          }
          if (printDir) {
            this.props.description.push(
              `${inlineCode(teamDir)}: ${italic(teamFile?.title)}`
            )
          } else {
            let printTeam = true
            if (sectionType) {
              printTeam = (sectionType == teamDir)
            }
            if (printTeam) {
              if (!roster[teamDir]) {
                roster[teamDir] = {}
              }
              let team = {
                avatar: teamFile?.avatar,
                color: teamFile?.color,
                title: teamFile?.title,
                jobs: {}
              }
              for (let [jName, jData] of Object.entries(teamFile.members)) {
                team.jobs[jData.title] = jData.users
              }
              roster[teamDir] = team
            }
          }
        }
      }
    }

    for (let [teamDir, team] of Object.entries(roster)) {
      // If we've got an avatar, set it
      if (team?.avatar) {
        this.props.playerTypes = {
          user: "bot",
          target: "team"
        }
        this.props.entities = {
          team: {
            name: `${team.title} Roster`,
            avatar: team.avatar
          }
        }
      }

      // Set the stripe color
      this.props.color = team.stripe
      // Set the title
      this.props.title = {
        text: `${team.title} Roster`
      }

      this.props.description = []
      // Cycle through sections
      for (let [sectionTitle, sectionUsers] of Object.entries(team?.jobs)) {
        // Add the section title
        this.props.description.push(bold(sectionTitle))
        // Cycle through users
        for (let username of sectionUsers) {
          // Try to get the Guild Member
          let member = await this.getCache(client, interactionGuild, "members", username)
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

    return !this.error
  }
}
