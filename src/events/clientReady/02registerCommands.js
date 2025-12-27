// @ts-nocheck

const { ApplicationCommandOptionType } = require('discord.js')
const areCommandsDifferent = require('../../utils/client/areCommandsDifferent')
const getLocalCommands = require('../../utils/client/getLocalCommands')
const fs = require('fs/promises')

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

let helpDoc = {}
let aliasesDoc = {}

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
  if (cmdParts?.options && cmdParts.options.length > 0) {
    for(let option of cmdParts.options) {
      slimoptions.push(
        {
          name: option.name,
          description: option.description,
          required: option.required
        }
      )
    }
  }
  cmdHelp = {
    name: cmdParts.name,
    category: cmdParts.category,
    description: cmdParts.description,
    options: slimoptions,
    parent: cmdParts?.parent,
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
  let result = false
  let messages = []

  // Find existing command if present
  const existingCommand = applicationCommands.find(
    cmd => cmd.name === cmdParts.name
  )

  // Add to Help
  if(!(cmdParts.category in helpDoc)) {
    helpDoc[cmdParts.category] = {}
  }
  helpDoc[cmdParts.category][cmdParts.name] = buildCommandHelp(cmdParts, "local")

  // If command already exists
  if (existingCommand) {
    // If we're deleting it
    //  Delete it and return
    if (cmdParts.deleted) {
      messages.push(`${client.profile.emojis.delete} Deleting: "${cmdParts.name}"`)
      try {
        await commandsManager.delete(existingCommand.id)
        delete client.commands[cmdParts.name]
        delete helpDoc[cmdParts.category][cmdParts.name]
      } catch (error) {
        messages.push(`${client.profile.emojis.fail} Failed to delete: "${cmdParts.name}":`, error.message)
      }
      return [result, messages]
    }

    // If they're different
    if (areCommandsDifferent(existingCommand, cmdParts)) {
      messages.push(`${client.profile.emojis.reload} Updating: "${cmdParts.name}"`)
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
          messages.push(`${client.profile.emojis.wait} Rate limit hit. Retrying for "${cmdParts.name}" after ${error.retry_after ?? 1000}ms.`)
          // Wait
          await wait(error.retry_after ?? 1000)
          // Try to edit again
          await commandsManager.edit(
            existingCommand.id,
            cmdParts
          )
          // Save it
          client.commands[cmdParts.name] = await commandsManager.fetch(existingCommand.id)

          // Add to Help
          if(!(cmdParts.category in helpDoc)) {
            helpDoc[cmdParts.category] = {}
          }
          helpDoc[cmdParts.category][cmdParts.name] = buildCommandHelp(cmdParts, "edited")
        } else {
          // Failed to edit
          messages.push(`${client.profile.emojis.fail} Failed to edit: "${cmdParts.name}":`, error.message)
        }
      }
    } else {
      // No change
      messages.push(`${client.profile.emojis.current} Current: "${cmdParts.name}"`)
      client.commands[cmdParts.name] = existingCommand
    }
  } else {
    // Doesn't exist yet or we deleted it
    if (cmdParts.deleted) {
      messages.push(`${client.profile.emojis.skip} Skipping deleted: "${cmdParts.name}"`)
      return [result, messages]
    }

    // Instantiate it if OOP Command
    if (cmdParts.name.includes("Command")) {
      let cmd = await new localCommand()
      cmdParts = extractCommand(cmd)
    }

    // Register New Command
    messages.push(`${client.profile.emojis.yes} Registering new: "${cmdParts.name}"`)
    try {
      // Create New
      let newCommand = await commandsManager.create(cmdParts)
      client.commands[cmdParts.name] = newCommand

      // Add to Help
      if(!(cmdParts.category in helpDoc)) {
        helpDoc[cmdParts.category] = {}
      }
      helpDoc[cmdParts.category][cmdParts.name] = buildCommandHelp(cmdParts, "new")
    } catch (error) {
      // If error
      if (error.code === 429) {
        // Rate Limit, try again soon
        messages.push(`${client.profile.emojis.wait} Rate limit hit. Retrying for "${cmdParts.name}" after ${error.retry_after ?? 1000}ms.`)
        // Wait
        await wait(error.retry_after ?? 1000)
        // Try to create again
        let newCommand = await commandsManager.create(cmdParts)
        // Save it
        client.commands[cmdParts.name] = newCommand
      } else {
        // Failed to register
        messages.push(`${client.profile.emojis.fail} Failed to register: "${cmdParts.name}":`, error.message)
      }
    }
  }

  return [result, messages]
}

module.exports = async (client) => {
  let result = false
  let messages = []

  let purge = client.profile?.purgeCommands

  if (purge) {
    return [result, messages]
  }

  try {
    const testGuildID = process.env.GUILD_ID
    const localCommands = getLocalCommands(client)

    // Determine if we are in development or production mode
    let isDevelopment = !process.env.ENV_ACTIVE.startsWith('prod')
    let commandsManager = null

    if (isDevelopment) {
      const testGuild = client.guilds.cache.get(testGuildID)
      if (!testGuild) {
        messages.push(`${client.profile.emojis.fail} Test guild not found: ${testGuildID}`)
        return [result, messages]
      }
      messages.push(`${client.profile.emojis.devText} Running in development mode. Registering Guild Commands to: '${testGuild.name}' [${testGuildID}]`)
      commandsManager = testGuild.commands
    } else {
      messages.push(`${client.profile.emojis.prodText} Running in production mode. Registering Global Commands.`)
      commandsManager = client.application.commands
    }

    const applicationCommands = await commandsManager.fetch()
    client.commands = {}

    for (const localCommand of localCommands) {
      // Get Command Parts
      let cmdParts = await extractCommand(localCommand)

      // Attempt to register command
      let [thisResult, thisMessages] = await registerCommand(
        client,
        commandsManager,
        applicationCommands,
        cmdParts
      )
      result = thisResult
      messages = messages.concat(thisMessages)

      // Print aliases if present
      if (cmdParts.aliases && cmdParts.aliases.length > 0) {
        // continue
        let parentName = cmdParts.name
        if (!aliasesDoc[parentName]) {
          aliasesDoc[parentName] = {}
        }
        for (let alias of cmdParts.aliases) {
          cmdParts.name = alias?.name
          cmdParts.description = alias?.description
          cmdParts.defaultOptions = alias?.options
          if (!aliasesDoc[parentName][cmdParts.name]) {
            aliasesDoc[parentName][cmdParts.name] = {}
          }
          let newOptions = []
          if (cmdParts?.options && cmdParts.options.length > 0) {
            for (let i in cmdParts.options) {
              let option = cmdParts.options[i]
              if (alias?.options) {
                if (!Object.keys(alias?.options).includes(option.name)) {
                  newOptions.push(option)
                }
              }
            }
          }

          cmdParts.options = newOptions
          cmdParts.parent = parentName
          let msg = ""
          msg = cmdParts.name + ": "
          for (let [msgName, msgValue] of Object.entries(alias.options)) {
            aliasesDoc[parentName][cmdParts.name][msgName] = msgValue
          }
          messages.push(msg)

          if (cmdParts.options.length == 0) {
            delete cmdParts.options
          }
          delete cmdParts.aliases

          // Attempt to register command alias
          let [thisResult, thisMessages] = await registerCommand(
            client,
            commandsManager,
            applicationCommands,
            cmdParts
          )
          result = thisResult
          messages = messages.concat(thisMessages)
        }
      }
    }

    messages.push(`${client.profile.emojis.success} Registration completed`)
    await fs.writeFile(
      "./src/res/app/manifests/help/help.json",
      (
        JSON.stringify(
          helpDoc,
          null,
          2
        ) +
        "\n"
      ).replace(/\n/g, "\r\n")
    )
    await fs.writeFile(
      "./src/res/app/manifests/help/aliases.json",
      (
        JSON.stringify(
          aliasesDoc,
          null,
          2
        ) + 
        "\n"
      ).replace(/\n/g, "\r\n")
    )
    result = true
  } catch (error) {
    messages.push(`${client.profile.emojis.fail} Registration error: ${error.stack}`)
    result = true
  }

  return [result, messages]
}
