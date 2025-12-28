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
    console.log(in_url)
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
              value: `${itemValue} `.trim().ucfirst()
            }
          )
        }
      }
      fields.push(fieldRow)
    }
  } else if (gameID == "m3maprando") {
    // SM Map Rando
    fields = []
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
            case "transition_letters":
              itemValue = sources["settings"]?.other_settings.transition_letters ? emojis.check : emojis.nocheck
              break
            case "energy_free_shinesparks":
              itemValue = sources["settings"]?.other_settings.energy_free_shinesparks ? emojis.check : emojis.nocheck
              break
            case "ultra_low_qol":
              itemValue = sources["settings"]?.other_settings.ultra_low_qol ? emojis.check : emojis.nocheck
              break
            case "tournament":
              itemValue = sources["settings"]?.other_settings.race_mode ? emojis.check : emojis.nocheck
              break
            case "hash_id":
              itemValue = hyperlink(
                            inlineCode(hashID),
                            `https://maprando.com/seed/${hashID}`
                          )
              break
            case "metadata":
              itemValue = hyperlink(
                            "Settings",
                            `https://maprando.com/seed/${hashID}/data/settings.json`
                          ) + ", " +
                          hyperlink(
                            "Spoiler",
                            `https://maprando.com/seed/${hashID}/data/spoiler.json`
                          )
              break
            case "compiled_maps":
              itemValue = `By ` +
                          hyperlink(
                            "Area",
                            `https://maprando.com/seed/${hashID}/data/map-assigned.png`
                          ) + ", " +
                          hyperlink(
                            "Origin",
                            `https://maprando.com/seed/${hashID}/data/map-vanilla.png`
                          )
              break
            case "visualizer":
              itemValue = hyperlink(
                            inlineCode(hashID),
                            `https://maprando.com/seed/${hashID}/data/visualizer/index.html`
                          )
              break
            default:
              itemValue = itemCell["value"]
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
              value: `${itemValue} `.trim().ucfirst()
            }
          )
        }
      }
      fields.push(fieldRow) 
    }
  } else if (["z3m3", "z1m1z3m3", "sm-total"].includes(gameID)) {
    // Z3M3
    // Quad
    // SM Total
    let decoded = decode(hashID).replaceAll("-",'')

    let rData = fileFuncs.getAFile(
      [
        "src",
        "dbs",
        "randos"
      ],
      `${gameID}.json`
    )
    if (
      [
        "z3m3",
        "sm-total"
      ].includes(gameID)
    ) {
      gameID = "z3m3"
    }
    let fData = fileFuncs.getAFile(
      [
        "src",
        "dbs",
        "randos"
      ],
      `${gameID}.json`
    )
    let sources = {}
    for (let [sKey, sData] of Object.entries(fData["rando"]["fields"]["sources"])) {
      let check = false
      console.log(`URL: ${sData['url']}, Check: ${sData['check']}`)
      if (
        sData["url"].includes("[") ||
        sData["url"].includes("]") ||
        sData["url"].includes("seeddata.")
      ) {
        let urlParts = sData["url"].split(".")
        let urlObj = urlParts.shift()
        let urlSub = urlParts.join(".")
        let evalCheck = `sources["${urlObj}"]`
        if (urlSub != "") {
          evalCheck += `.${urlSub}`
        }
        check = eval(evalCheck)
        sources[sKey] = check
        let isJSON = false
        try {
          isJSON = JSON.parse(sources[sKey])
          if (isJSON) {
            sources[sKey] = JSON.parse(sources[sKey])
          }
        } catch(err) {
          // do nothing
        }
      } else {
        sources[sKey] = await get_url(sData["url"].replace("<slugid>",decoded))
        check = sources[sKey][sData["check"]]
      }
      if (!check) {
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
      if (sources[sKey]["spoiler"]) {
        sources[sKey]["spoiler"] = null
      }
    }
    console.log(sources)
    fields = []

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
    sources["settings"].opentower = nums.indexOf(sources["settings"]?.opentower?.replace("crystals","").ucfirst())
    sources["settings"].ganonvulnerable = nums.indexOf(sources["settings"]?.ganonvulnerable?.replace("crystals","").ucfirst())
    sources["settings"].opentourian = nums.indexOf(sources["settings"]?.opentourian?.replace("bosses","").ucfirst())
    let goal = sources["settings"]?.goal
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

    let permalinkURL = rData.rando.permalink.replace("<hash>", hashID)
    let apiURL = rData.rando.fields.sources["hash_meta"].url.replace("<slugid>", decoded)

    for (let itemRow of fData["rando"]["fields"]["items"]) {
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
            case "goal":
              itemValue = goal
              break
            case "tower/ganon":
              itemValue = (sources["settings"]?.opentower && sources["settings"].opentower && sources["settings"].opentower > -1) ? `${sources["settings"]?.opentower} Crystals/${sources["settings"]?.ganonvulnerable} Crystals` : ""
              break
            case "tourian_open":
              itemValue = (sources["settings"]?.opentourian && sources["settings"].opentourian && sources["settings"].opentourian > -1) ? `${sources["settings"]?.opentourian} G4 Bosses` : ""
              break
            case "race_hash":
              itemValue = inlineCode(sources["hash_meta"]?.hash)
              break
            case "permalink":
              itemValue = hyperlink(
                            inlineCode(hashID),
                            permalinkURL
                          )
              break
            case "guid_permalink":
              itemValue = hyperlink(
                            inlineCode(decoded),
                            apiURL
                          )
              break
            default:
              itemValue = itemCell["value"]
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
              value: `${itemValue} `.trim().ucfirst()
            }
          )
        }
      }
      fields.push(fieldRow)
    }
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
          value: timeFormat(moment.utc(metadata.created).format("x"), { with: "relative" })
        }
      ],
      [
        {
          name: "Rando Version",
          value: metadata.randoVersion
        },
        {
          name: "Game Version",
          value: metadata.gameVersion
        },
        {
          name: "itemProgression",
          value: settings.itemProgression
        }
      ],
      [
        {
          name: "progressionRate",
          value: settings.progressionRate
        },
        {
          name: "itemPriority",
          value: settings.itemPriority
        },
        {
          name: "wideBeforePlasma",
          value: settings.wideBeforePlasma
        }
      ],
      [
        {
          name: "missileStart",
          value: settings.missileStart
        },
        {
          name: "etankStart",
          value: settings.etankStart
        },
        {
          name: "reserveXStart",
          value: settings.reserveXStart
        }
      ],
      [
        {
          name: "powerBombStart",
          value: settings.powerBombStart
        },
        {
          name: "chargeBeamStart",
          value: settings.chargeBeamStart
        },
        {
          name: "iceMissileStart",
          value: settings.iceMissileStart
        }
      ],
      [
        {
          name: "samusSprite",
          value: settings.samusSprite
        },
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

    fields = []
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
      if (
        sData["url"].includes("[") ||
        sData["url"].includes("]") ||
        sData["url"].includes("seeddata.")
      ) {
        let urlParts = sData["url"].split(".")
        let urlObj = urlParts.shift()
        let urlSub = urlParts.join(".")
        let evalCheck = `sources["${urlObj}"]`
        if (urlSub != "") {
          evalCheck += `.${urlSub}`
        }
        check = eval(evalCheck)
        sources[sKey] = check
        let isJSON = false
        try {
          isJSON = JSON.parse(sources[sKey])
        } catch(err) {
          // do nothing
        }
        if (isJSON) {
          sources[sKey] = JSON.parse(sources[sKey])
        }
      } else {
        sources[sKey] = await get_url(sData["url"].replace("<hash>",hashID))
        check = sources[sKey][sData["check"]]
      }
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
            case "seed":
              itemValue = inlineCode(sources["metadata"].seed)
              break
            case "hash":
              itemValue = inlineCode(sources["metadata"].hash4Word)
              break
            case "time":
              itemValue = timeFormat(moment.utc(sources["metadata"].created).format("x"), { with: "relative" })
              break
            case "permalink":
              itemValue = hyperlink(
                            inlineCode(hashID),
                            `https://castie.ddns.net/xf_rando/seed/${hashID}/`
                          )
              break
            case "seed_json":
              itemValue = hyperlink(
                            inlineCode(hashID),
                            `https://castie.ddns.net/xf_rando/seed/${hashID}/data/seed.json`
                          )
              break
            case "logic_json":
              itemValue = hyperlink(
                            inlineCode(hashID),
                            `https://castie.ddns.net/xf_rando/seed/${hashID}/data/logic.json`
                          )
              break
            default:
              itemValue = itemCell["value"]
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
              value: `${itemValue} `.trim().ucfirst()
            }
          )
        }
      }
      fields.push(fieldRow) 
    }
  }

  return fields
}
