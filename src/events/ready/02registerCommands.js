// @ts-nocheck

const { ApplicationCommandOptionType } = require('discord.js')
const areCommandsDifferent = require('../../utils/areCommandsDifferent')
const getLocalCommands = require('../../utils/getLocalCommands')
const fs = require('fs/promises')

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

let help = {}

async function extractCommand(command) {
  let {
    name,
    category,
    description,
    options = [],
    access,
    aliases,
    deleted
  } = await command

  return {
    name,
    category,
    description,
    options,
    access,
    aliases,
    deleted
  }
}
function buildCommandHelp(cmdParts, segment="local") {
  let cmdHelp = {}
  let slimoptions = []
  for(let option of cmdParts.options) {
    slimoptions.push(
      {
        name: option.name,
        description: option.description,
        required: option.required
      }
    )
  }
  cmdHelp = {
    name: cmdParts.name,
    category: cmdParts.category,
    description: cmdParts.description,
    options: slimoptions,
    access: cmdParts.access,
    segment: segment
  }

  return cmdHelp
}
async function registerCommand(
  client,
  commandsManager,
  applicationCommands,
  cmdParts
) {
  // Find existing command if present
  const existingCommand = applicationCommands.find(
    cmd => cmd.name === cmdParts.name
  )

  // If command already exists
  if (existingCommand) {
    // If we're deleting it
    //  Delete it and return
    if (cmdParts.deleted) {
      console.log(`  🗑 Deleting: "${cmdParts.name}"`)
      try {
        await commandsManager.delete(existingCommand.id)
        delete client.commands[cmdParts.name]
      } catch (error) {
        console.error(`  ❌ Failed to delete: "${cmdParts.name}":`, error.message)
      }
      return
    }

    // If they're different
    if (areCommandsDifferent(existingCommand, cmdParts)) {
      console.log(`  🔁 Updating: "${cmdParts.name}"`)
      try {
        // Edit it
        await commandsManager.edit(
          existingCommand.id,
          cmdParts
        )
        // Save it
        client.commands[cmdParts.name] = await commandsManager.fetch(existingCommand.id)
      } catch (error) {
        // Else
        if (error.code === 429) {
          // Rate Limit, try again soon
          console.warn(`  ⏳ Rate limit hit. Retrying for "${cmdParts.name}" after ${error.retry_after || 1000}ms.`)
          // Wait
          await wait(error.retry_after || 1000)
          // Try to edit again
          await commandsManager.edit(
            existingCommand.id,
            cmdParts
          )
          // Save it
          client.commands[cmdParts.name] = await commandsManager.fetch(existingCommand.id)
        } else {
          // Failed to edit
          console.error(`  ❌ Failed to edit: "${cmdParts.name}":`, error.message)
        }
      }
    } else {
      // No change
      console.log(`  ✅ Current: "${cmdParts.name}"`)
      client.commands[cmdParts.name] = existingCommand
    }
  } else {
    // Doesn't exist yet or we deleted it
    if (cmdParts.deleted) {
      console.log(`  ⏩ Skipping deleted: "${cmdParts.name}"`)
      return
    }

    // Instantiate it if OOP Command
    if (cmdParts.name.indexOf("Command") > -1) {
      let cmd = await new localCommand()
      cmdParts = extractCommand(cmd)
    }

    // Register New Command
    console.log(`  👍 Registering new: "${cmdParts.name}"`)
    try {
      // Add to Help
      if(!(cmdParts.category in help)) {
        help[cmdParts.category] = {}
      }
      help[cmdParts.category][cmdParts.name] = buildCommandHelp(cmdParts, "new")

      // Create New
      let newCommand = await commandsManager.create(cmdParts)
      client.commands[cmdParts.name] = newCommand
    } catch (error) {
      // If error
      if (error.code === 429) {
        // Rate Limit, try again soon
        console.warn(`  ⏳ Rate limit hit. Retrying for "${cmdParts.name}" after ${error.retry_after || 1000}ms.`)
        // Wait
        await wait(error.retry_after || 1000)
        // Try to create again
        let newCommand = await commandsManager.create(cmdParts)
        // Save it
        client.commands[cmdParts.name] = newCommand
      } else {
        // Failed to register
        console.error(`  ❌ Failed to register: "${cmdParts.name}":`, error.message)
      }
    }
  }
}

module.exports = async (client) => {
  try {
    const testGuildID = process.env.GUILD_ID
    const localCommands = getLocalCommands(client)

    // Determine if we are in development or production mode
    let isDevelopment = !process.env.ENV_ACTIVE.startsWith('prod')
    let commandsManager = null

    if (isDevelopment) {
      const testGuild = client.guilds.cache.get(testGuildID)
      if (!testGuild) {
        console.error(`  ❌ Test guild not found: ${testGuildID}`)
        return
      }
      console.log(`  🛠 Running in development mode. Using test server: '${testGuild.name}' [${testGuildID}]`)
      commandsManager = testGuild.commands
    } else {
      console.log('  🌐 Running in production mode. Registering global commands.')
      commandsManager = client.application.commands
    }

    const applicationCommands = await commandsManager.fetch()
    client.commands = {}

    for (const localCommand of localCommands) {
      // Get Command Parts
      let cmdParts = await extractCommand(localCommand)

      // Prepare Help
      if(!(cmdParts.category in help)) {
        help[cmdParts.category] = {}
      }
      // Build Help and Save it
      help[cmdParts.category][cmdParts.name] = buildCommandHelp(cmdParts)

      // Attempt to register command
      await registerCommand(
        client,
        commandsManager,
        applicationCommands,
        cmdParts
      )

      // Print aliases if present
      if (cmdParts.aliases && cmdParts.aliases.length > 0) {
        // continue
        for (let alias of cmdParts.aliases) {
          cmdParts.name = alias?.name
          cmdParts.description = alias?.description
          cmdParts.defaultOptions = alias?.options
          let newOptions = []
          if (cmdParts?.options && cmdParts.options.length > 0) {
            for (let i in cmdParts.options) {
              let option = cmdParts.options[i]
              if (!Object.keys(alias?.options).includes(option.name)) {
                newOptions.push(option)
              }
            }
          }

          cmdParts.options = newOptions

          if (cmdParts.options.length == 0) {
            delete cmdParts.options
          }
          delete cmdParts.aliases

          // Attempt to register command alias
          await registerCommand(
            client,
            commandsManager,
            applicationCommands,
            cmdParts
          )
        }
      }
    }

    console.log('  🎉 Registration completed')
    await fs.writeFile(
      "./src/res/app/manifests/help/help.json",
      (
        JSON.stringify(
          help,
          null,
          2
        ) +
        "\n"
      ).replace(/\n/g, "\r\n")
    )
  } catch (error) {
    console.error(`  ❌ Registration error: ${error.stack}`)
  }
}
