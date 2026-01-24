const getters = require('../guild/getters')

module.exports = async (client, guildId) => {
    let applicationCommands

    if (guildId) {
      const guild = getters.getCache(client, client, "guilds", guildId)
      applicationCommands = guild.commands
    } else {
      applicationCommands = await client.application.commands
    }

    await applicationCommands.fetch()
    return applicationCommands
  }
