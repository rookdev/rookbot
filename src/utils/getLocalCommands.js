const getAllFiles = require('./getAllFiles')
const path = require('path')

module.exports = (client, exceptions = []) => {
  let localCommands = []

  const commandCategories = getAllFiles(
    path.join(__dirname, '..', 'commands'),
    true
  )

  for (const commandCategory of commandCategories) {
    const commandFiles = getAllFiles(commandCategory)

    for (const commandFile of commandFiles) {
      let commandObject = require(commandFile)

      if (exceptions.includes(commandObject.name)) {
        continue
      }

      if (commandObject.name.indexOf("Command") > -1) {
        let cmd = new commandObject(client)
        commandObject = cmd
      }

      localCommands.push(commandObject)
    }
  }

  return localCommands
}
