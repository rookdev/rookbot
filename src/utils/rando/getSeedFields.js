// Formatters
const { inlineCode, hyperlink } = require('discord.js')
const stringFuncs = require('../../utils/primitives/stringFuncs')
const fileFuncs = require('../../utils/fs/fileFuncs')
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

  let randoSeedTitles = fileFuncs.getAFile(
    [
      "src",
      "dbs",
      "randos"
    ],
    "titles.json"
  )

  // Z3R
  if (gameID == "z3r") {
    let rData = fileFuncs.getAFile(
      [
        "src",
        "dbs",
        "randos"
      ],
      `${gameID}.json`
    )
    let sources = {}
    for (let [sKey, sData] of Object.entries(rData["rando"]["fields"]["sources"])) {
      sources[sKey] = await get_url(sData["url"].replace("<hash>",hashID))
      if (!sources[sKey][sData["check"]]) {
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
    }

    let generatedDateTime = moment.utc(sources.hash_meta?.generated)

    fields = []
    for (let itemRow of rData["rando"]["fields"]["items"]) {
      let fieldRow = []
      for (let itemCell of itemRow) {
        let itemName = itemCell["name"]
        let itemValue = null
        if (typeof itemCell["value"] != "string") {
          for (let sKey of itemCell["value"]) {
            // console.log(sKey,itemName,itemValue)
            if (!itemValue) {
              itemValue = sources[sKey]
            } else {
              itemValue = itemValue[sKey]
            }
          }
        } else if (itemCell["value"] == "???") {
          switch(itemCell["name"]) {
            case "items":
              itemValue = ""
              itemValue += sources.hash_meta?.item_placement.ucfirst()
              itemValue += '/'
              itemValue += sources.hash_meta?.item_pool.ucfirst()
              itemValue += '/'
              itemValue += sources.hash_meta?.item_functionality.ucfirst()
              break
            case "tower/ganon":
              itemValue = ""
              itemValue += sources.hash_meta?.entry_crystals_tower + " Crystals"
              itemValue += '/'
              itemValue += sources.hash_meta?.entry_crystals_ganon + " Crystals"
              break
            case "tournament":
              itemValue = sources.hash_meta?.tournament ? emojis.check : emojis.nocheck
              break
            case "pseudoboots":
              itemValue = sources.hash_meta?.pseudoboots ? emojis.check : emojis.nocheck
              break
            case "hash_id":
              itemValue = hyperlink(
                inlineCode(sources.hash_meta?.hash),
                `http://alttpr.com/h/${sources.hash_meta?.hash}`
              )
              break
            case "generation_date":
              itemValue = timeFormat(generatedDateTime.format("x"), { with: "relative" })
              break
          }
        }
        if (itemName && itemValue) {
          if (randoSeedTitles[itemName]) {
            itemName = randoSeedTitles[itemName]
          } else {
            itemName = itemName.split("_").map(x => x.ucfirst()).join(" ")
          }
          fieldRow.push(
            {
              name: itemName,
              value: itemValue.ucfirst()
            }
          )
        }
      }
      fields.push(fieldRow)
    }
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
  } else if (gameID == "m4xfr") {
    // SM X-Fusion Rando
    let seedData = await get_url(`https://castie.ddns.net/xf_rando/seed/${hashID}/data/seed.json`)
    let metadata = seedData.metadata
    let settings = seedData.settings
    let logic = await get_url(`https://castie.ddns.net/xf_rando/seed/${hashID}/data/logic.json`)
    if (!metadata?.randoVersion) {
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
          name: "Seed",
          value: metadata.seed
        },
        {
          name: "Hash",
          value: metadata.hash4Word
        },
        {
          name: "Time",
          value: moment.utc(metadata.created)
        }
      ],
      [
        {
          name: "Version",
          value: metadata.randoVersion
        },
        {
          name: "itemProgression",
          value: settings.itemProgression
        },
        {
          name: "progressionRate",
          value: settings.progressionRate
        }
      ],
      [
        {
          name: "itemPriority",
          value: settings.itemPriority
        },
        {
          name: "wideBeforePlasma",
          value: settings.wideBeforePlasma
        },
        {
          name: "missileStart",
          value: settings.missileStart
        }
      ],
      [
        {
          name: "etankStart",
          value: settings.etankStart
        },
        {
          name: "reserveXStart",
          value: settings.reserveXStart
        },
        {
          name: "powerBombStart",
          value: settings.powerBombStart
        }
      ],
      [
        {
          name: "chargeBeamStart",
          value: settings.chargeBeamStart
        },
        {
          name: "iceMissileStart",
          value: settings.iceMissileStart
        },
        {
          name: "samusSprite",
          value: settings.samusSprite
        }
      ],
      [
        {
          name: "Start Location",
          value: logic.startLocation.fullName
        }
      ],
      [
        {
          name: "Permalink",
          value: hyperlink(
            inlineCode(hashID),
            `https://castie.ddns.net/xf_rando/seed/${hashID}/`
          )
        },
        {
          name: "Seed JSON",
          value: hyperlink(
            inlineCode(hashID),
            `https://castie.ddns.net/xf_rando/seed/${hashID}/data/seed.json`
          )
        },
        {
          name: "Logic JSON",
          value: hyperlink(
            inlineCode(hashID),
            `https://castie.ddns.net/xf_rando/seed/${hashID}/data/logic.json`
          )
        }
      ]
    ]
  }

  return fields
}
