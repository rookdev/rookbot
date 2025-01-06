// @ts-nocheck

const salutation = require('../maybeReady/salutation')

module.exports = async (client, interaction) => {
  let result = false
  let messages = []

  result = await salutation(client, interaction, "goodbye")

  return [result, messages]
}
