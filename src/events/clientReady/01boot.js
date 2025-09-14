// @ts-nocheck

const manageCommands = require('../../utils/client/manageCommands')
const emojis = require('../../dbs/emojis.json')

module.exports = async (client) => {
  let result = false
  let messages = []

  let GLOBALS = client.profile

  console.log(JSON.stringify(emojis))

  // Optional: Delete commands if enabled in the profile
  if (GLOBALS.deleteCommands) {
    result = await manageCommands(
      {
        delete: GLOBALS.deleteCommands,
        purge: GLOBALS.purgeCommands
      },
      process.env.GUILD_ID,
      GLOBALS.name,
      process.env.CLIENT_ID,
      process.env.TOKEN
    )
  } else {
    messages.push(`${client.profile.emojis.good} Command deletion is disabled.`)
    return [result, messages]
  }

  return [result, messages]
}
