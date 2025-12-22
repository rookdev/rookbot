// @ts-nocheck

const { ApplicationCommandOptionType } = require('discord.js')
const { RookCommand } = require('../../classes/command/rcommand.class')
const getSeedFields = require('../../utils/rando/getSeedFields')
const fileFuncs = require('../../utils/fs/fileFuncs')

module.exports = class SeedMetaCommand extends RookCommand {
  constructor(client) {
    let comprops = {
      name: "seedmeta",
      category: "rando",
      description: "Gets metadata for a seed",
      options: [
        {
          name: "hash-id",
          description: "Seed Hash ID to call",
          type: ApplicationCommandOptionType.String,
          required: true
        },
        {
          name: "game-id",
          description: "Game ID to call from",
          type: ApplicationCommandOptionType.String,
          choices: [
            {
              name:   "A Link to the Past Randomizer",
              value:  "z3r"
            },
            {
              name:   "Super Metroid + A Link to the Past Combination Randomizer",
              value:  "z3m3"
            },
            {
              name:   "Super Metroid Map Randomizer",
              value:  "m3maprando"
            },
            {
              name:   "Super Metroid Item Randomizer",
              value:  "sm-total"
            },
            {
              name:   "Super Metroid X-Fusion Randomizer",
              value:  "m4xfr"
            }
            // {
            //   name:   "Quad Randomizer",
            //   value:  "z1m1z3m3"
            // }
          ]
        }
      ],
      testOptions: [
        { "game-id": "z3r",         "hash-id": "0yAONb6XMV" },
        { "game-id": "z3m3",        "hash-id": "q8q8Z5NMQlGiSYgqPHKTkA" },
        // { "game-id": "z1m1z3m3",    "hash-id": "MOaOZII0QzS80DG9VTluXw" },
        { "game-id": "m3maprando",  "hash-id": "wPvtmGMpc" },
        { "game-id": "sm-total",    "hash-id": "_TbXSywzRgKAMpFAoaiNLQ" },
        { "game-id": "m4xfr",       "hash-id": "VE9YSUMgQk9NQiBIT1JOVE8gVEFOSw" }
      ]
    }
    let props = {
      title: {
        text: "Seed Metadata"
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
    let gameID = coptions['game-id'] ?? "z3r"
    let hashID = coptions['hash-id'] ?? ""

    if (gameID == "z3r" && hashID != "") {
      for (let filename of fileFuncs.getAllFiles(
        [
          "src",
          "dbs",
          "randos"
        ]
      )) {
        let randoData = fileFuncs.getAFile(
          [
            "src",
            "dbs",
            "randos"
          ],
          filename
        )
        if (randoData?.rando?.permalink) {
          if (hashID.includes(randoData.rando.permalink.replace("<hash>",""))) {
            let filenameParts = filename.split("\\")
            if (filenameParts.length < 2) {
              filenameParts = filename.split("/")
            }
            gameID = filenameParts[filenameParts.length - 1]
            gameID = gameID.substring(0, gameID.indexOf("."))
          }
        }
      }
    }

    if (hashID.includes("http://") || hashID.includes("https://")) {
      if (hashID.endsWith("/")) {
        hashID = hashID.substring(0, hashID.length - 1)
      }
      hashID = hashID.split("/")
      hashID = hashID[hashID.length - 1]
    }

    let fields = await getSeedFields(hashID, gameID)

    let randoData = require(`../../dbs/randos/${gameID}.json`)
    this.props.title = {
      text: randoData.rando.player.name
    }
    this.props.playerTypes = {
      user: "bot",
      target: "target"
    }
    this.props.entities = {
      target: {
        text: this.props.title.text,
        avatar: randoData.rando.player.avatar
      }
    }

    // Z3R
    if (gameID == "z3r") {
      this.props.image = {
        image: `http://alttp.mymm1.com/code/${hashID}.png`
      }
    } else if (gameID == "m3maprando") {
      // M3 Map Rando
      this.props.image = {
        image: ""
      }
    } else if (gameID == "z3m3") {
      // Z3M3
      this.props.image = {
        image: ""
      }
    } else if (gameID == "sm-total") {
      // SM
      this.props.image = {
        image: ""
      }
    }

    if (fields.length > 0) {
      if (fields[0].length > 0) {
        if (fields[0][0].name == "Error") {
          this.error = true
          this.props.description = fields[0].value
        } else {
          this.props.fields = fields
        }
      }
    }

    return !this.error
  }
}
