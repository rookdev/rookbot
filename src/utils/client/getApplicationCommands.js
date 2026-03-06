const getters = require('../guild/getters')

module.exports = async (client, guildId) => {
    let applicationCommands

    if (guildId) {
      const guild = getters.getCachedGuild(client, guildId)
      applicationCommands = guild.commands
    } else {
      applicationCommands = await client.application.commands
    }

    await applicationCommands.fetch()
    return applicationCommands
  }
