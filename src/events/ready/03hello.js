// @ts-nocheck

const salutation = require('../maybeReady/salutation')

module.exports = async (client, interaction) => {
  await salutation(client, interaction, "hello")
}
