// @ts-nocheck

const scheduleNicknameChange = require('../../utils/guild/scheduleNicknameChange')
const mentionFuncs = require('../../utils/formatters/mentions')
const numFuncs = require('../../utils/primitives/numFuncs')
const getters = require('../../utils/guild/getters')
const path = require('path')
const fs = require('fs')

// natSort
function natSort(a, b) {
  return a.localeCompare(b, undefined, { numeric: true });
}

module.exports = async (client) => {
  let result = false
  let messages = []

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
      numFuncs.myIsNumeric(fileName.substring(0, fileName.indexOf(".") - 1))
    )
    // Strip .json extension
    .map(
      fileName=>fileName.replace(".json","")
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
        (fileName) => numFuncs.myIsNumeric(fileName)
      )
      .sort(natSort)

      // Cycle through guilds
    for(let guildID of guilds) {
      // Find the guild
      let guild = await getters.getCache(client, client, "guilds", guildID)
      if (!guild || !guild?.id) {
        continue
      }

      try {
        // Get the guild member
        const member = await getters.getCache(client, guild, "members", userID)
        if (!member) {
          messages.push(`${client.profile.emojis.fail} Member ${userID} not found in ${mentionFuncs.guildMention(guild.name, guild.id, { showID: true, oneLine: true, textOnly: true })}!`)
          continue
        }
        // If guild owner, bail
        let memberGuild = await getters.getProp(client, member, "guild")
        if (guild?.ownerId === member.id) {
          messages.push(`${client.profile.emojis.fail}* No  scheduled nickname changes for '${member.user.tag}' in ${mentionFuncs.guildMention(guild.name)}. '${member.user.tag}' is server owner.`)
          continue
        }

        // Get the client member
        const clientMember  = guild.members.me
        const clientPos     = await clientMember.roles.highest.position
        const memberPos     = await member.roles.highest.position

        // If member's not the bot
        if (member.id !== clientMember.id) {
          // If member is above or equal to the bot
          if (memberPos >= clientPos) {
            // If member is over the bot, bail
            let relation = ""
            if (memberPos > clientPos) {
              relation = "^"
            } else if (memberPos == clientPos) {
              // If member is at the bot, bail
              relation = "="
            }
            let msg = `${client.profile.emojis.fail}${relation} No`
            if (relation == "^") {
              relation = "greater than"
            } else if (relation == "=") {
              relation = "equal to"
            }
            msg += `  scheduled nickname changes for '${member.user.tag}' in ${mentionFuncs.guildMention(member.guild.name)}. '${member.user.tag}' is ${relation} '${clientMember.displayName}'.`
            messages.push(msg)
            continue
          }
        }

        if (member) {
          // If we got here, schedule the nickname change
          let [thisResult, thisMessages] = await scheduleNicknameChange(client, member)
          result = thisResult
          messages = messages.concat(thisMessages)
        }
      } catch (error) {
        // messages = [...messages, error.stack]
      }
    }
  }

  return [result, messages]
}
