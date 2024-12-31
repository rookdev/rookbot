// @ts-nocheck

const scheduleNicknameChange = require('../../utils/scheduleNicknameChange')
const path = require('path')
const fs = require('fs')

// Does this resemble a number?
// FIXME: Consolidate
function isNumeric(n) {
  let isaN      = !isNaN(n)
  let isBool    = typeof n === "boolean"
  let isStr     = typeof n === "string"
  let isNumStr  = (
    isStr &&
    ((n.replace(/\D/g, '') + "") == (n + ""))
  )

  return (isaN || isNumStr) && !isBool
}

module.exports = async (client) => {
  // Get nickname data
  let nicknameDataPath = path.join(
    __dirname,
    "..",
    "..",
    "dbs",
    "nicknames",
  )

  // Users to search for
  let users = fs.readdirSync(nicknameDataPath)
    // Filter JSON documents that are numeric
    .filter(
      (fileName) => fileName.indexOf(".json") > -1 &&
        isNumeric(fileName.substring(0, fileName.indexOf(".") - 1))
    )
    // Strip .json extension
    .map(
      (fileName) => fileName.replace(".json","")
    )
    // Skip first document
    .slice(1)
  // Cycle through users
  for(let userID of users) {
    // Guilds to search in
    let guilds = fs.readdirSync(path.join(nicknameDataPath,".."))
      // Filter folders that are numeric
      .filter(
        (fileName) => isNumeric(fileName)
      )
    // Cycle through guilds
    for(let guildID of guilds) {
      // Find the guild
      let guild = await client.guilds.cache.find(
        g => g.id === guildID
      )
      try {
        // Get the guild member
        const member = await guild.members.fetch(userID, { force: true }) || null

        if (member) {
          // If we got here, schedule the nickname change
          await scheduleNicknameChange(client, member)
        }
      } catch (error) {
        const member = null
      }
    }
  }
}
