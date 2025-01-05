// @ts-nocheck

const manageCommands = require('../../utils/manageCommands')
const emojis = require('../../dbs/emojis.json')

module.exports = async (client) => {
  let GLOBALS = client.profile

  console.log(JSON.stringify(emojis))

  // Optional: Delete commands if enabled in the profile
  if (GLOBALS.deleteCommands) {
    await manageCommands(
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
    console.log(`  ${client.profile.emojis.good} Command deletion is disabled.`)
  }
}
