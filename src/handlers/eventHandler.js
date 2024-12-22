const getAllFiles = require('../utils/getAllFiles')
const path = require('path')

module.exports = (client) => {
  const eventFolders = getAllFiles(
    path.join(
      __dirname,
      '..',
      'events'
    ),
    true
  )

  for (const eventFolder of eventFolders) {
    let eventFiles = getAllFiles(eventFolder)
    eventFiles = eventFiles.sort()

    const eventName = eventFolder.replace(/\\/g, '/').split('/').pop()

    client.on(eventName, async (...args) => {
      for (const eventFile of eventFiles) {
        if (
          (eventFile.indexOf("interactionCreate") < 0) &&
          (eventFile.indexOf("messageUpdate") < 0)
        ) {
          console.log(`Event: ${eventFolder.split('\\').slice(-1)[0]}`)
          console.log(` Script: ${eventFile.split('\\').slice(-1)[0]}`)
        }
        const eventFunction = require(eventFile)
        await eventFunction(client, ...args) // Pass all arguments to the event function
      }
    })
  }
}
