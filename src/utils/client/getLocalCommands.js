const fileFuncs = require('../fs/fileFuncs')

module.exports = (client, exceptions = []) => {
  let localCommands = []

  const commandCategories = fileFuncs.getAllFiles(
    [
      "src",
      "commands"
    ],
    true
  )

  for (const commandCategory of commandCategories) {
    const commandFiles = fileFuncs.getAllFiles(commandCategory)

    for (const commandFile of commandFiles) {
      let commandObject = require(commandFile)

      if (exceptions.includes(commandObject.name)) {
        continue
      }

      if (commandObject.name.includes("Command")) {
        let cmd = new commandObject(client)
        commandObject = cmd
      }

      localCommands.push(commandObject)
    }
  }

  return localCommands
}
