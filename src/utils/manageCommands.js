const { REST, Routes } = require('discord.js')

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
      console.log(`  🗑 Deleting commands for bot: ${botName}`)
      const commands = await rest.get(
        Routes.applicationGuildCommands(
          clientId,
          serverId
        )
      )

      const deletePromises = commands.map(
        (command) => {
          console.log(`   🗑 Deleting: "${command.name}"`)
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
      console.log('   👍 All commands deleted.')
    } else {
      console.log('   ⏩ Command deletion skipped.')
    }
  } catch (error) {
    console.error(`   ❌ Error managing commands for bot: ${botName}`, error)
  }
}

module.exports = manageCommands
