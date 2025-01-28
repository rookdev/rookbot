const { REST, Routes } = require('discord.js')
const emojis = require ("../dbs/emojis.json")

const manageCommands = async (
  deleteCommands,
  serverId,
  botName,
  clientId,
  token
) => {
  const rest = new REST({ version: '10' }).setToken(token)

  try {
    if (deleteCommands) {
      console.log(`  ${emojis.delete} Deleting commands for bot: ${botName}`)
      const commands = await rest.get(
        Routes.applicationGuildCommands(
          clientId,
          serverId
        )
      )

      const deletePromises = commands.map(
        (command) => {
          console.log(`   ${emojis.delete} Deleting: "${command.name}"`)
          rest.delete(
            Routes.applicationGuildCommand(
              clientId,
              serverId,
              command.id
            )
          )
        }
      )

      await Promise.all(deletePromises)
      console.log(`   ${emojis.yes} All commands deleted.`)
    } else {
      console.log(`   ${emojis.skip} Command deletion skipped.`)
    }
  } catch (error) {
    console.error(`   ${emojis.fail} Error managing commands for bot: ${botName}`, error)
  }
}

module.exports = manageCommands
