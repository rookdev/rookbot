// @ts-nocheck

const { ApplicationCommandOptionType } = require('discord.js')
const { RookCommand } = require('../../classes/command/rcommand.class')
const timeFormat = require('../../utils/timeFormat')
const { decode } = require('slugid')
const strtotime = require('locutus/php/datetime/strtotime')

async function get_url(in_url) {
  try {
    let req = await fetch(in_url)
    let json = await req.json()
    return json
  } catch(e) {
    console.log(e.stack)
  }
}

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
            }
          ]
        }
      ],
      testOptions: [
        { "game-id": "z3r",         "hash-id": "0yAONb6XMV" },
        { "game-id": "z3m3",        "hash-id": "q8q8Z5NMQlGiSYgqPHKTkA" },
        { "game-id": "m3maprando",  "hash-id": "wPvtmGMpc" }
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
    // console.log(gameID,hashID)

    let hash_meta = null

    if (hashID == "") {
      this.error = true
      this.props.description = `No hashID sent!`
      return false
    }

    // Z3R
    if (gameID == "z3r") {
      hash_meta = await get_url(`http://alttp.mymm1.com/seeds/meta.php?hash=${hashID}`)
      this.props.image = { image: `http://alttp.mymm1.com/code/${hashID}.png` }
      this.props.title = { text: "Z3R" }
      this.props.playerTypes = {
        user: "bot",
        target: "target"
      }
      this.props.entities = {
        target: {
          name: this.props.title.text,
          avatar: "http://alttp.mymm1.com/holyimage/images/alttpo/z3r.png"
        }
      }

      if (!hash_meta?.hash) {
        this.error = true
        this.props.description = `Hash data for '${hashID}' not found!`
        this.props.fields = []
        return false
      }

      let generatedDateTime = new Date(strtotime(hash_meta?.generated))

      this.props.fields = [
        [
          {
            name: "📝Logic",
            value: hash_meta.logic
          },
          {
            name: "🎒Items",
            value: `${hash_meta?.item_placement.ucfirst()}/${hash_meta?.item_pool.ucfirst()}/${hash_meta?.item_functionality.ucfirst()}`
          },
          {
            name: "🗝️Dungeon Items",
            value: hash_meta?.dungeon_items.ucfirst()
          }
        ],
        [
          {
            name: "♿Accessibility",
            value: hash_meta?.accessibility.ucfirst()
          },
          {
            name: "🏁Goal",
            value: hash_meta?.goal.ucfirst()
          },
          {
            name: "♖Tower/🐗Ganon",
            value: `${hash_meta?.entry_crystals_tower} Crystals/${hash_meta?.entry_crystals_ganon} Crystals`
          }
        ],
        [
          {
            name: "🌐World State",
            value: hash_meta?.mode.ucfirst()
          },
          {
            name: "⚁Boss Shuffle",
            value: hash_meta["enemizer.boss_shuffle"].ucfirst()
          },
          {
            name: "⚀Enemy Shuffle",
            value: hash_meta["enemizer.enemy_shuffle"].ucfirst()
          }
        ],
        [
          {
            name: "⚔️Weapons",
            value: hash_meta?.weapons.ucfirst()
          },
          {
            name: "⚔️Enemy Damage",
            value: hash_meta["enemizer.enemy_damage"].ucfirst()
          },
          {
            name: "❤️Enemy Health",
            value: hash_meta["enemizer.enemy_health"].ucfirst()
          },
        ],
        [
          {
            name: "🛠️Build",
            value: hash_meta?.build
          },
          {
            name: "🥇Tournament",
            value: hash_meta?.tournament ? "Yes" : "No"
          },
          {
            name: "👢Pseudoboots",
            value: hash_meta?.pseudoboots ? "Yes" : "No"
          },
        ],
        [
          {
            name: "🍯Pot Shuffle",
            value: hash_meta["enemizer.pot_shuffle"].ucfirst()
          },
          {
            name: "#️Hash ID",
            value: `[\`${hash_meta?.hash}\`](http://alttpr.com/h/${hash_meta?.hash})`
          },
          {
            name: "Generation Date",
            value: timeFormat(generatedDateTime.getTime())
          }
        ]
      ]
    }

    // M3MapRando
    if (gameID == "m3maprando") {
      let settings = await get_url(`http://maprando.com/seed/${hashID}/data/settings.json`)
      this.props.image = {}
      this.props.title = { text: "M3 Map Rando" }
      this.props.playerTypes = {
        user: "bot",
        target: "target"
      }
      this.props.entities = {
        target: {
          name: this.props.title.text,
          avatar: "http://alttp.mymm1.com/holyimage/images/alttpo/m3maprando.gif"
        }
      }

      if (!settings?.version) {
        this.error = true
        this.props.description = `Settings data for '${hashID}' not found!`
        this.props.fields = []
        return false
      }

      this.props.fields = [
        [
          {
            name: "📝Objectives",
            value: settings?.objectives_mode
          },
          {
            name: "🗺️Map Layout",
            value: settings?.map_layout
          },
          {
            name: "🚪Doors Mode",
            value: settings?.doors_mode
          }
        ],
        [
          {
            name: "▶️Start Location",
            value: settings?.start_location_mode
          },
          {
            name: "🐱Save Animals Expectation?",
            value: settings?.save_animals
          },
          {
            name: "👢Wall Jump?",
            value: settings?.other_settings.wall_jump
          }
        ],
        [
          {
            name: "🥫ETank Refill?",
            value: settings?.other_settings.etank_refill
          },
          {
            name: "🗺️Area Assignment",
            value: settings?.other_settings.area_assignment
          },
          {
            name: "◻️Item Dot Change",
            value: settings?.other_settings.item_dot_change
          }
        ],
        [
          {
            name: "🗺️Transition Letters?",
            value: settings?.other_settings.transition_letters ? "Yes" : "No"
          },
          {
            name: "🔒Door Locks Size",
            value: settings?.other_settings.door_locks_size
          },
          {
            name: "🗺️Maps Revealed?",
            value: settings?.other_settings.maps_revealed
          }
        ],
        [
          {
            name: "🗺️Map Station Reveal",
            value: settings?.other_settings.map_station_reveal
          },
          {
            name: "✨Energy-Free Shinesparks?",
            value: settings?.other_settings.energy_free_shinesparks ? "Yes" : "No"
          },
          {
            name: "🌡️Ultra-Low QoL?",
            value: settings?.other_settings.ultra_low_qol ? "Yes" : "No"
          }
        ],
        [
          {
            name: "🥇Race Mode?",
            value: settings?.other_settings.race_mode ? "Yes" : "No"
          },
          {
            name: "#️Hash ID",
            value: `[\`${hashID}\`](https://maprando.com/seed/${hashID})`
          },
          {
            name: "📝Settings",
            value: `[\`${hashID}\`](https://maprando.com/seed/${hashID}/data/settings.json)`
          }
        ],
        [
          {
            name: "📝Spoiler",
            value: `[\`${hashID}\`](https://maprando.com/seed/${hashID}/data/spoiler.json)`
          },
          {
            name: "🗺️Map by Area",
            value: `[\`${hashID}\`](https://maprando.com/seed/${hashID}/data/map-assigned.png)`
          },
          {
            name: "🗺️Map by Origin",
            value: `[\`${hashID}\`](https://maprando.com/seed/${hashID}/data/map-vanilla.png)`
          }
        ],
        [
          {
            name: "👀Visualizer",
            value: `[\`${hashID}\`](https://maprando.com/seed/${hashID}/data/visualizer/index.html)`
          }
        ]
      ]
    }

    // Z3M3
    if (gameID == "z3m3") {
      this.props.image = {}
      this.props.title = { text: "SMZ3" }
      this.props.playerTypes = {
        user: "bot",
        target: "target"
      }
      this.props.entities = {
        target: {
          name: this.props.title.text,
          avatar: "http://alttp.mymm1.com/holyimage/images/alttpo/smz3.png"
        }
      }

      let decoded = decode(hashID).replaceAll("-",'')

      hash_meta = await get_url(`http://samus.link/api/seed/${decoded}`)
      if (!hash_meta?.worlds) {
        this.error = true
        this.props.description = `Hash data for '${hashID}/${decoded}' not found!`
        this.props.fields = []
        return false
      }

      let settings = hash_meta.worlds[0].settings
      settings = JSON.parse(settings)

      let nums = [
        "Zero",
        "One",
        "Two",
        "Three",
        "Four",
        "Five",
        "Six",
        "Seven"
      ]
      settings.opentower = nums.indexOf(settings.opentower.replace("crystals","").ucfirst())
      settings.ganonvulnerable = nums.indexOf(settings.ganonvulnerable.replace("crystals","").ucfirst())
      settings.opentourian = nums.indexOf(settings.opentourian.replace("bosses","").ucfirst())
      let goal = settings?.goal
      if (goal) {
        switch(goal) {
          case "defeatboth":
            goal = "🐗Defeat Ganon &" + "\n" + "🧠Mother Brain"
            break
          case "fastganondefeatmotherbrain":
            goal = "🐗Fast Ganon &" + "\n" + "🧠Defeat Mother Brain"
            break
          case "alldungeonsdefeatmotherbrain":
            goal = "⚀⚂⚄⚁⚀⚀All Dungeons &" + "\n" + "🧠Defeat Mother Brain"
            break
        }
      }

      this.props.fields = [
        [
          {
            name: "📝SMLogic",
            value: settings?.smlogic.ucfirst()
          },
          {
            name: "🗝️Dungeon Items",
            value: settings?.keyshuffle.ucfirst()
          },
        ],
        [
          {
            name: "🏁Goal",
            value: goal
          },
          {
            name: "♖Tower/🐗Ganon",
            value: `${settings?.opentower} Crystals/${settings?.ganonvulnerable} Crystals`
          },
          {
            name: "🧠Tourian Open",
            value: `${settings?.opentourian} G4 Bosses`
          }
        ],
        [
          {
            name: "🌐World State",
            value: settings?.gamemode.ucfirst()
          },
          {
            name: "⚔️Sword Location",
            value: settings?.swordlocation.ucfirst()
          },
          {
            name: "⚪Morph Location",
            value: settings?.morphlocation.ucfirst()
          },
        ],
        [
          {
            name: "📝Version",
            value: hash_meta?.gameVersion
          },
          {
            name: "🥇Tournament",
            value: settings?.race == "true" ? "Yes" : "No"
          }
        ],
        [
          {
            name: "#️Race Hash",
            value: `\`${hash_meta?.hash}\``
          },
          {
            name: "#️Seed ID",
            value: `[\`${hashID}\`](https://samus.link/seed/${hashID})`
          },
          {
            name: "#️Seed Guid",
            value: `[\`${decoded}\`](https://samus.link/api/seed/${decoded})`
          }
        ]
      ]
    }

    return !this.error
  }
}
