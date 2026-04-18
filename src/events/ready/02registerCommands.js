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
  messages.push(` ${client.profile.emojis.yes} Registering new: "${cmdParts.name}"`)

  return [result, messages]
}

module.exports = async (client) => {
  let result = false
  let messages = []

  // const testGuildID = process.env.GUILD_ID
  const localCommands = await getLocalCommands(client)

  let isDevelopment = !process.env.ENV_ACTIVE.startsWith('prod')
  if (isDevelopment) {
    // const testGuild = await getters.getCache(client, client, "guilds", testGuildID)
    // if (!testGuild) {
    //   messages.push(`${client.profile.emojis.fail} Test guild not found: ${testGuildID}`)
    //   return [result, messages]
    // }
    // messages.push(`${client.profile.emojis.devText} Running in development mode. Registering Guild Commands to: ${mentionFuncs.guildMention(testGuild.name, testGuildID, { showID: true, textOnly: true, oneLine: true })}`)
    messages.push(`${client.profile.emojis.devText} Running in development mode. Registering Guild Commands.`)
  } else {
    messages.push(`${client.profile.emojis.prodText} Running in production mode. Registering Global Commands.`)
  }

  client.commands = {}

  // cycle through commands and add to client
  for (const localCommand of localCommands) {
    let cmdParts = await extractCommand(localCommand)
    let cmdRes = await registerCommand(client, localCommand, cmdParts)
    result = cmdRes[0]
    messages.push(...cmdRes[1])
  }

  return [result, messages]
}
