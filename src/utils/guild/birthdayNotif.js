const { inlineCode, italic } = require('discord.js')
const mentionFuncs = require('../../utils/formatters/mentions')
const dbFuncs = require('../../utils/db/dbFuncs')
const getters = require('../../utils/guild/getters')

// Main function to compare commands
module.exports = (client, guild) => {
  birthdayNotif(client, guild)
}

let bdaysDB = {}

// Function to change a member's nickname
async function birthdayNotif(client, guild) {
  let success = false
  let messages = []

  if (!guild) {
    success = false
    messages.push(`No Guild sent.`)

    return {
      success: success,
      message: messages
    }
  }

  if (!client?.guilds) {
    success = false
    messages.push(`Couldn't load Client Guilds.`)

    return {
      success: success,
      message: messages
    }
  }

  // Get Guild ID
  let guildID = guild.id
  // Get Guild Data
  let guildData = await getters.getCachedGuild(client, guildID)

  let bdays = null
  let dbRes = await dbFuncs.getDB(
    guildID,
    "bdays"
  )
  bdays = dbRes[0]
  messages.push(...dbRes[1])

  try {
    // Set new nickname
    success = true
    // messages.push(
    //   // `🟩${italic(guildData.name)}: ` +
    //   `${client.profile.emojis.check} ${clientMember} changed target nickname to ${italic(newNickname)}.`
    // )
  } catch(error) {
    success = false
    // messages.push(
    //   // `🟥${italic(guildData.name)}: ` +
    //   `${client.profile.emojis.fail} ${clientMember} failed to change target nickname. Error: ${italic(error.message)}`
    // )
    // messages.push(
    //   {
    //     guild: guildData.name,
    //     guildID: guildID,
    //     newNickname: newNickname,
    //     target: JSON.stringify(guildMember.permissions.toArray().sort()),
    //     clientUser: JSON.stringify(clientMember.permissions.toArray().sort())
    //   }
    // )
  }
  return {
    success: success,
    message: messages,
    bdays: bdays
  }
}

module.exports = { birthdayNotif }
