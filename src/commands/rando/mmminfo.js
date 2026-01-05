// @ts-nocheck

/**
 * Discord Stuff
 *  Command Option Types
 *  Formatters
 *   bold
 *   italic
 *   hyperlink
 *   userMention
 */
const {
  ApplicationCommandOptionType,
  bold,
  italic,
  hyperlink,
  userMention
} = require('discord.js')

// Base Rook Command
const { RookCommand } = require('../../classes/command/rcommand.class')
const stringFuncs = require('../../utils/primitives/stringFuncs')
const timeFormat = require('../../utils/formatters/timeFormat')
const fileFuncs = require('../../utils/fs/fileFuncs')
const moment = require('moment')

module.exports = class MMMInfoCommand extends RookCommand {
  constructor(client) {
    let comprops = {
      name: "mmminfo",
      category: "rando",
      description: "Calls up information from Mothula's Multiworld Mayhem",
      options: [
        {
          name: "episode-id",
          description: "Which MMM to view?",
          type: ApplicationCommandOptionType.String
        }
      ]
    }
    let props = {}

    super(
      client,
      {...comprops},
      {...props}
    )
  }

  // declare props: import('../../types/embed').EmbedProps

  async action(client, interaction, coptions) {
    // Get Episode
    let episodeID = coptions["episode-id"] ?? "winners"

    if (episodeID != "winners") {
      let episodes = await fileFuncs.getAURL(
        "https://rookdev.github.io/mmm-data/dbs/example.json"
      )
      if (!Object.keys(episodes).includes(episodeID)) {
        episodeID = "winners"
      } else {
        let episode = episodes[episodeID]

        this.props = {
          title: { text: `MMM #${episodeID}`},
          description: [],
          entities: {
            user: {
              name: "Mothula's Multiworld Mayhem",
              avatar: "https://cdn.discordapp.com/guilds/1450159772622913628/users/192821967802466304/avatars/19060e0ae7693f7ec4b39775e38fe20e.webp?size=256",
              url: "http://mothula.neocities.org/MMM"
            }
          },
          playerTypes: {
            user: "user",
            target: "user"
          }
        }
        if (episode?.datetime && episode.datetime != "") {
          episode.datetime = timeFormat(episode.datetime, { with: "relative" })
        }
        this.props.description.push(episode.datetime)
        this.props.description.push("")

        for (let [pName, pData] of Object.entries(episode.players)) {
          let trophies = ""
          for (let trophy of pData.eligible) {
            let emoji = interaction.guild.emojis.cache.find(
              e => (e.name === `mmm${trophy}`) || (e.name === `:mmm${trophy}:`)
            )
            trophies += `${emoji}`
          }
          this.props.description.push(
            [
              `${bold(pName)}: ${italic(pData.game)} [${trophies}]`
            ]
          )
        }

        this.props.description.push("")
        this.props.description.push(
          hyperlink(
            "Mothula's Multiworld Mayhem",
            "http://mothula.neocities.org/MMM"
          )
        )
      }
    }

    if (episodeID == "winners") {
      let mmmWinners = await fileFuncs.getAURL(
        "https://rookdev.github.io/mmm-data/dbs/winners.json"
      )


      for (let [tType, tData] of Object.entries(mmmWinners)) {
        let props = {
          title: { text: `${tData.name} Trophy` },
          color: tData.color,
          description: [tData.description],
          entities: {
            user: {
              name: "Mothula's Multiworld Mayhem",
              avatar: "https://cdn.discordapp.com/guilds/1450159772622913628/users/192821967802466304/avatars/19060e0ae7693f7ec4b39775e38fe20e.webp?size=256",
              url: "http://mothula.neocities.org/MMM"
            },
            target: {
              name: tData.name + " Trophy",
              avatar: `http://alttp.mymm1.com/images/mmm/trophies/${tType}.png`
            }
          },
          playerTypes: {
            user: "user",
            target: "target"
          }
        }
        props.description.push("")

        for (let winner of tData.winners) {
          let uGames = []
          for (let game of winner.games) {
            if (!uGames.includes(game.name)) {
              uGames.push(game.name)
            }
          }
          props.description.push(
            bold(winner.name) +
            ": " +
            winner.games.length +
            " " + "Trophy".pluralize(winner.games.length) +
            "; " +
            uGames.length + 
            " Unique " +
            "Game".pluralize(uGames.length)
          )
        }

        props.description.push("")
        props.description.push(
          hyperlink(
            "Mothula's Multiworld Mayhem",
            "http://mothula.neocities.org/MMM"
          )
        )
        this.pages.push(props)
      }
    }
  }
}
