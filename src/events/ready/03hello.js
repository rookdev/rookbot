// @ts-nocheck

const BotActivityCommand = require('../../commands/bot/botactivity')
const salutation = require('../maybeReady/salutation')

module.exports = async (client, interaction) => {
  // Execute Salutation Command
  await salutation(client, interaction, "hello")

  // Get BotActivity Command Object
  let activityCmd = new BotActivityCommand(client)

  // Execute BotActivity Command Object
  await activityCmd.execute(client)
}
