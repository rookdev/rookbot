// Formatters
const { inlineCode, hyperlink } = require('discord.js')
// Use Discord HammerTime
const timeFormat = require('../formatters/timeFormat')
// Decode slugIDs
const { decode } = require('slugid')
// Canned Emojis
const emojis = require('../../dbs/emojis.json')
const moment = require('moment')

async function get_url(in_url) {
  try {
    let req = await fetch(in_url)
    let json = await req.json()
    return json
  } catch(e) {
    console.log(e.stack)
  }
}

module.exports = async (hashID, gameID="z3r") => {
  let hash_meta = null
  let fields = [
    [
      {
        name: "Error",
        value: "No Data found!"
      }
    ]
  ]

  if (hashID == "") {
    // Need a HashID
    return [
      [
        {
          name: "Error",
          value: "No HashID sent!"
        }
      ]
    ]
  }

  if (gameID == "") {
    // Need a GameID
    return [
      [
        {
          name: "Error",
          value: "No GameID sent!"
        }
      ]
    ]
  }

  // Z3R
  if (gameID == "z3r") {
    hash_meta = await get_url(`http://alttp.mymm1.com/seeds/meta.php?hash=${hashID}`)

    if (!hash_meta?.generated) {
      // Hash Data not found
      return [
        [
          {
            name: "Error",
            value: "No Hash Data found!"
          }
        ]
      ]
    }

    let generatedDateTime = moment(hash_meta?.generated)

    fields = [
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
          value: hash_meta?.tournament ? emojis.check : emojis.nocheck
        },
        {
          name: "👢Pseudoboots",
          value: hash_meta?.pseudoboots ? emojis.check : emojis.nocheck
        },
      ],
      [
        {
          name: "🍯Pot Shuffle",
          value: hash_meta["enemizer.pot_shuffle"].ucfirst()
        },
        {
          name: "#️Hash ID",
          value: "" +
            hyperlink(
              inlineCode(hash_meta?.hash),
              `http://alttpr.com/h/${hash_meta?.hash}`
            )
        },
        {
          name: "Generation Date",
          value: timeFormat(generatedDateTime.format("X"))
        }
      ]
    ]
  } else if (gameID == "m3maprando") {
    // SM Map Rando
    let settings = await get_url(`http://maprando.com/seed/${hashID}/data/settings.json`)
    if (!settings?.version) {
      // Settings Data not found
      return [
        [
          {
            name: "Error",
            value: "No Settings Data found!"
          }
        ]
      ]
    }

    fields = [
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
          value: settings?.other_settings.transition_letters ? emojis.check : emojis.nocheck
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
          value: settings?.other_settings.energy_free_shinesparks ? emojis.check : emojis.nocheck
        },
        {
          name: "🌡️Ultra-Low QoL?",
          value: settings?.other_settings.ultra_low_qol ? emojis.check : emojis.nocheck
        }
      ],
      [
        {
          name: "🥇Race Mode?",
          value: settings?.other_settings.race_mode ? emojis.check : emojis.nocheck
        },
        {
          name: "#️Hash ID",
          value: "" +
            hyperlink(
              inlineCode(hashID),
              `https://maprando.com/seed/${hashID}`
            )
        },
        {
          name: "📝Metadata",
          value: "" +
            hyperlink(
              "Settings",
              `https://maprando.com/seed/${hashID}/data/settings.json`
            ) + ", " +
            hyperlink(
              "Spoiler",
              `https://maprando.com/seed/${hashID}/data/spoiler.json`
            )
        }
      ],
      [
        {
          name: "🗺️Compiled Maps",
          value: `By ` +
            hyperlink(
              "Area",
              `https://maprando.com/seed/${hashID}/data/map-assigned.png`
            ) + ", " +
            hyperlink(
              "Origin",
              `https://maprnado.com/seed/${hashID}/data/map-vanilla.png`
            )
        },
        {
          name: "👀Visualizer",
          value: "" +
            hyperlink(
              inlineCode(hashID),
              `https://maprando.com/seed/${hashID}/data/visualizer/index.html`
            )
        }
      ]
    ]
  } else if (["z3m3", "z1m1z3m3", "sm-total"].includes(gameID)) {
    // Z3M3
    let decoded = decode(hashID).replaceAll("-",'')

    let permalinkURL = `https://samus.link/seed/${hashID}`
    let apiURL = ""

    if (gameID == "z3m3") {
      apiURL = `https://samus.link/api/seed/${decoded}`
    } else if (gameID == "z1m1z3m3") {
      // FIXME: Doesn't work
      // apiURL = `https://quad.beta.samus.link/api/seed/${decoded}`
    } else if (gameID == "sm-total") {
      apiURL = `https://sm.samus.link/api/seed/${decoded}`
    }
    hash_meta = await get_url(apiURL)
    console.log(apiURL)

    if (!hash_meta?.worlds) {
      // Hash Data not found
      return [
        [
          {
            name: "Error",
            value: "No Hash Data found!"
          }
        ]
      ]
    }

    let settings = hash_meta.worlds[0].settings
    settings = JSON.parse(settings)

    if (!settings?.goal) {
      return [
        [
          {
            name: "Error",
            value: "No Settings Data found!"
          }
        ]
      ]
    }

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
    settings.opentower = nums.indexOf(settings?.opentower?.replace("crystals","").ucfirst())
    settings.ganonvulnerable = nums.indexOf(settings?.ganonvulnerable?.replace("crystals","").ucfirst())
    settings.opentourian = nums.indexOf(settings?.opentourian?.replace("bosses","").ucfirst())
    let goal = settings?.goal
    if (goal) {
      switch(goal) {
        case "defeatboth":
          goal = "🐗Defeat Ganon &" + "\n" + "🧠Mother Brain"
          break
        case "defeatmb":
          goal = "🧠Defeat Mother Brain"
          break
        case "fastganondefeatmotherbrain":
          goal = "🐗Fast Ganon &" + "\n" + "🧠Defeat Mother Brain"
          break
        case "alldungeonsdefeatmotherbrain":
          goal = "⚀⚂⚄⚁⚀⚀All Dungeons &" + "\n" + "🧠Defeat Mother Brain"
          break
      }
    }

    fields = [
      [
        {
          name: "📝Logic",
          value: settings?.logic?.ucfirst()
        },
        {
          name: "📝SMLogic",
          value: settings?.smlogic?.ucfirst()
        },
        {
          name: "🗝️Dungeon Items",
          value: settings?.keyshuffle?.ucfirst()
        },
      ],
      [
        {
          name: "🏁Goal",
          value: goal
        },
        {
          name: "♖Tower/🐗Ganon",
          value: gameID != "sm-total" ? `${settings?.opentower} Crystals/${settings?.ganonvulnerable} Crystals` : ""
        },
        {
          name: "🧠Tourian Open",
          value: gameID != "sm-total" ? `${settings?.opentourian} G4 Bosses` : ""
        }
      ],
      [
        {
          name: "🌐World State",
          value: settings?.gamemode?.ucfirst()
        },
        {
          name: "⚔️Sword Location",
          value: settings?.swordlocation?.ucfirst()
        },
        {
          name: "⚪Morph Location",
          value: settings?.morphlocation?.ucfirst()
        },
      ],
      [
        {
          name: "📝Version",
          value: hash_meta?.gameVersion
        },
        {
          name: "🥇Tournament",
          value: settings?.race == "true" ? emojis.check : emojis.nocheck
        }
      ],
      [
        {
          name: "#️Race Hash",
          value: inlineCode(hash_meta?.hash)
        },
        {
          name: "#️Seed ID",
          value: "" +
            hyperlink(
              inlineCode(hashID),
              permalinkURL
            )
        },
        {
          name: "#️Seed Guid",
          value: "" +
            hyperlink(
              inlineCode(decoded),
              apiURL
            )
        }
      ]
    ]
  }

  return fields
}
