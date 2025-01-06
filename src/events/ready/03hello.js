// @ts-nocheck

const BotActivityCommand = require('../../commands/bot/botactivity')
const salutation = require('../maybeReady/salutation')

module.exports = async (client, interaction) => {
  let result = false
  let messages = []

  // Execute Salutation Command
  await salutation(client, interaction, "hello")

  // Get BotActivity Command Object
  let activityCmd = new BotActivityCommand(client)

  // Execute BotActivity Command Object
  result = await activityCmd.execute(client)

  return [result, messages]
}
