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

// natSort
function natSort(a, b) {
  return a.localeCompare(b, undefined, { numeric: true });
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
      (fileName) => fileName.includes(".json") &&
        isNumeric(fileName.substring(0, fileName.indexOf(".") - 1))
    )
    // Strip .json extension
    .map(
      (fileName) => fileName.replace(".json","")
    )
    // Skip first document
    .slice(1)
    .sort(natSort)
  // Cycle through users
  for(let userID of users) {
    // Guilds to search in
    let guilds = fs.readdirSync(path.join(nicknameDataPath,".."))
      // Filter folders that are numeric
      .filter(
        (fileName) => isNumeric(fileName)
      )
      .sort(natSort)
    // Cycle through guilds
    for(let guildID of guilds) {
      // Find the guild
      let guild = await client.guilds.cache.find(
        g => g.id === guildID
      )
      if (!guild) {
        continue
      }

      try {
        // Get the guild member
        const member = await guild.members.fetch(userID, { force: true }) ?? null
        // If guild owner, bail
        if (member.guild.ownerId === member.id) {
          console.log(`   Failed to schedule nickname changes for '${member.user.tag}' in '${member.guild.name}'. '${member.user.tag}' is server owner.`)
          continue
        }

        // Get the client member
        const clientMember  = guild.members.me
        const clientPos     = await clientMember.roles.highest.position
        const memberPos     = await member.roles.highest.position

        // If member is at or over bot, bail
        if (memberPos >= clientPos) {
          console.log(`   Failed to schedule nickname changes for '${member.user.tag}' in '${member.guild.name}'. '${member.user.tag}' is greater than or equal to '${clientMember.displayName}'.`)
          continue
        }

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
