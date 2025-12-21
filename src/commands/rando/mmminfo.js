// @ts-nocheck

/**
 * Discord Stuff
 *  Formatters
 *   bold
 *   italic
 *   hyperlink
 *   userMention
 */
const {
  bold,
  italic,
  hyperlink,
  userMention
} = require('discord.js')

// Base Rook Command
const { RookCommand } = require('../../classes/command/rcommand.class')
const stringFuncs = require('../../utils/primitives/stringFuncs')
const fileFuncs = require('../../utils/fs/fileFuncs')

module.exports = class MMMInfoCommand extends RookCommand {
  constructor(client) {
    let comprops = {
      name: "mmminfo",
      category: "rando",
      description: "Calls up information from Mothula's Multiworld Mayhem",
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
    let mmmWinners = fileFuncs.getAFile(
      [
        "src",
        "dbs",
        "mmm",
      ],
      "winners.json"
    )

    for (let [tType, tData] of Object.entries(mmmWinners)) {

      let props = {
        title: { text: `${tData.name} Trophy` },
        color: tData.color,
        description: [tData.description],
        playerTypes: {
          target: "target"
        },
        playerTypes: {
          user: "user",
          target: "target"
        },
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
