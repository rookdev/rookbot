// @ts-nocheck

async function get_url(in_url) {
  try {
    let req = await fetch(in_url)
    let json = await req.json()
    return json
  } catch(e) {
    console.log(e.stack)
  }
}

// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length)
  this.length = from < 0 ? this.length + from : from
  return this.push.apply(this, rest)
}

module.exports = async (client, interaction) => {
  let result = false
  let messages = []

  if(interaction && interaction.isAutocomplete()) {
    let focused = await interaction.options.getFocused(true)

    // Help
    if(focused.name == "section-name") {
      let options = [
        { name: "Application Commands", value: "app" },
        { name: "Bot Commands",         value: "bot" },
        { name: "Diagnostics",          value: "diagnostic" },
        { name: "Dungeons of Infinity", value: "doi" },
        { name: "Fun",                  value: "fun" },
        { name: "Information",          value: "info" },
        { name: "Meta",                 value: "meta" },
        { name: "Miscellaneous",        value: "misc" },
        { name: "Moderation",           value: "mod" },
        { name: "Randomizers",          value: "rando" }
      ]
      interaction.respond(options)
    }

    // Holy Image
    if(focused.name == "game-id") {
      return
      let gameIDsPlus = await get_url(`http://alttp.mymm1.com/holyimage/metadata.php?mode=gameIDs&expand=1`)
      let options = gameIDsPlus["games"]
      let newoptions = []
      let i = 0
      for(let [gameID, gameName] of Object.entries(options)) {
        newoptions.push(
          {
            name: gameName,
            value: gameID
          }
        )
        i = i + 1
        if(i >= 25) {
          break
        }
      }
      // while(newoptions.length > 25) {
      //   newoptions.remove(Math.floor(Math.random() * newoptions.length))
      // }
      interaction.respond(newoptions)
    }
  }

  return [result, messages]
}
