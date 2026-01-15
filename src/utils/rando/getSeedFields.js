// Formatters
const { inlineCode, hyperlink } = require('discord.js')
const fileFuncs = require('../../utils/fs/fileFuncs')
// Use Discord HammerTime
const timeFormat = require('../formatters/timeFormat')
// Decode slugIDs
const { decode } = require('slugid')
// Canned Emojis
const emojis = require('../../dbs/emojis.json')
const moment = require('moment')

module.exports = async (hashID, gameID="z3r") => {
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

  let slugID = ""

  let randoSeedTitles = fileFuncs.getAFile(
    [
      "src",
      "dbs",
      "randos"
    ],
    "titles.json"
  )

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
      if (sData["url"].indexOf("<hash>") > -1) {
        sources[sKey] = await fileFuncs.getAURL(
          sData["url"].replace("<hash>",hashID),
          "json"
        )
      } else if (sData["url"].indexOf("<slugid>") > -1) {
        try {
          slugID = decode(hashID).replaceAll("-",'')
        } catch (e) {
          console.log(
            [
              sData["url"],
              hashID,
              e.stack
            ].join("\n")
          )
        }
        sources[sKey] = await fileFuncs.getAURL(
          sData["url"].replace("<slugid>",slugID),
          "json"
        )
      }
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

  if (["z1m1z3m3","sm-total"].includes(gameID)) {
    rData = fileFuncs.getAFile(
      [
        "src",
        "dbs",
        "randos"
      ],
      `z3m3.json`
    )
  }

  for (let itemRow of rData["rando"]["fields"]["items"]) {
    let fieldRow = []
    for (let itemCell of itemRow) {
      let itemName = itemCell["name"] ?? itemCell["value"].at(-1)
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
        if ([
          true,
          "true",
          "True",
          "yes",
          "Yes",
          "y",
          "Y"
        ].includes(itemValue)) {
          itemValue = emojis.check
        } else if ([
          false,
          "false",
          "False",
          "no",
          "No",
          "n",
          "N"
        ].includes(itemValue)) {
          itemValue = emojis.nocheck
        }
      } else if (itemCell["value"] == "???") {
        if (["z3r"].includes(gameID)) {
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
            case "hash_id":
              itemValue = hyperlink(
                inlineCode(sources.hash_meta?.hash),
                `http://alttpr.com/h/${sources.hash_meta?.hash}`
              )
              break
            case "generation_date":
              itemValue = timeFormat(moment.utc(sources.hash_meta?.generated).format("x"), { with: "relative" })
              break
          }
        } else if(["m3maprando"].includes(gameID)) {
          switch(itemCell["name"]) {
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
          }
        } else if(["z3m3","z1m1z3m3","sm-total"].includes(gameID)) {
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
          if (sources.settings?.opentower) {
            let tower = sources.settings.opentower
            console.log(`${gameID} Tower: ${tower}`)
            if (typeof tower == "string") {
              tower = nums.indexOf(
                tower.replace(
                  "crystals",
                  ""
                ).ucfirst()
              )
            }
          }
          if (sources.settings?.ganonvulnerable) {
            let ganon = sources.settings.ganonvulnerable
            console.log(`${gameID} Ganon: ${ganon}`)
            if (typeof ganon == "string") {
              ganon = nums.indexOf(
                ganon.replace(
                  "crystals",
                  ""
                ).ucfirst()
              )
            }
          }
          if (sources.settings?.opentourian) {
            let tourian = sources.settings.opentourian
            console.log(`${gameID} Tourian: ${tourian}`)
            if (typeof tourian == "string") {
              tourian = nums.indexOf(
                tourian.replace(
                  "bosses",
                  ""
                ).ucfirst()
              )
            }
          }
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

          if (typeof rData.rando.permalink == "object") {
            rData.rando.permalink = rData.rando.permalink[0]
          }
          let permalinkURL = rData.rando.permalink.replace("<hash>", hashID)
          let apiURL = rData.rando.fields.sources["hash_meta"].url.replace("<slugid>", slugID)

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
                            inlineCode(slugID),
                            apiURL
                          )
              break
          }
        } else if(["m4xfr"].includes(gameID)) {
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
  
  return fields
}
