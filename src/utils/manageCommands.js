const { REST, Routes } = require('discord.js')
const emojis = require("../dbs/emojis.json")

const manageCommands = async (
  options,
  serverId,
  botName,
  clientId,
  token
) => {
  const rest = new REST({ version: '10' }).setToken(token)
  let deleteCommands = options?.delete

  try {
    // If deleting
    if (deleteCommands) {
      // If Production
      if (process.env.ENV_ACTIVE.startsWith("prod")) {
        // Get Global Commands
        console.log(`  ${emojis.prodText}${emojis.delete} Deleting Global Commands for bot: '${botName}'`)
        const commands = await rest.get(
          Routes.applicationCommands(clientId)
        )

        // Delete Global Commands individually
        const deletePromises = commands.map(
          (command) => {
            console.log(`   ${emojis.prodText}${emojis.delete} Deleting: "${command.name}"`)
            rest.delete(
              Routes.applicationCommand(
                clientId,
                command.id
              )
            )
          }
        )

        await Promise.all(deletePromises)

        // Delete Global Commands in one go
        await rest.put(
          Routes.applicationCommands(clientId),
          { body: [] }
        )

        console.log(`   ${emojis.prodText}${emojis.yes} All Global Commands deleted.`)
      } else {
        // If Development
        // Get Guild Commands
        console.log(`  ${emojis.devText}${emojis.delete} Deleting Guild Commands for bot: '${botName}' in '${serverId}'`)
        const commands = await rest.get(
          Routes.applicationGuildCommands(
            clientId,
            serverId
          )
        )

        // Delete Guild Commands individually
        const deletePromises = commands.map(
          (command) => {
            console.log(`   ${emojis.devText}${emojis.delete} Deleting: "${command.name}"`)
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

        // Delete Guild Commands in one go
        await rest.put(
          Routes.applicationGuildCommands(
            clientId,
            serverId
          ),
          { body: [] }
        )

        console.log(`   ${emojis.devText}${emojis.yes} All Guild Commands deleted.`)
      }
    } else {
      console.log(`   ${emojis.skip} Command deletion skipped.`)
    }
  } catch (error) {
    console.error(`   ${emojis.fail} Error managing commands for bot: ${botName}`, error)
  }
}

module.exports = manageCommands
