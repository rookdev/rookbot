const getLocalCommands = require('../../utils/client/getLocalCommands')

async function extractCommand(command) {
  let {
    name
  } = await command

  return {
    name
  }
}

async function registerCommand(
  client,
  command,
  cmdParts
) {
  let result = false
  let messages = []

  client.commands[cmdParts.name] = command

  return [result, messages]
}

module.exports = async (client) => {
  let result = false
  let messages = []
  // cycle through commands and add to client
  messages.push(`Registering Commands`)

  const localCommands = await getLocalCommands(client)

  client.commands = {}

  for (const localCommand of localCommands) {
    let cmdParts = await extractCommand(localCommand)
    await registerCommand(client, localCommand, cmdParts)
  }

  return [result, messages]
}
