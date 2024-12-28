// @ts-nocheck
const getAllFiles = require('../utils/getAllFiles') // Get All Files
const path = require('path')                        // Easy filepath management

module.exports = (client) => {
  // Get all folders in ./events
  const eventFolders = getAllFiles(
    path.join(
      __dirname,
      '..',
      'events'
    ),
    true
  )

  // Cycle through folders
  for (const eventFolder of eventFolders) {
    // Get event scripts
    let eventFiles = getAllFiles(eventFolder)
    // Sort event scripts
    eventFiles = eventFiles.sort()

    // Get event name based on folder
    const eventName = eventFolder.replace(/\\/g, '/').split('/').pop()

    // onEvent
    client.on(eventName, async (...args) => {
      // Cycle through event scripts
      for (const eventFile of eventFiles) {
        // Skip it if it's *.off
        if (eventFile.endsWith(".off")) {
          continue
        }
        /**
         * Don't push these notifications to console for:
         *  interactionCreate
         *  messageUpdate
         */
        if (
          (eventFile.indexOf("interactionCreate") < 0) &&
          (eventFile.indexOf("messageUpdate") < 0)
        ) {
          // Print DateTime
          console.log(new Date().toISOString())
          // Print eventName & scriptName
          console.log(` Event: ${eventFolder.split('\\').slice(-1)[0]}`)
          console.log(`  Script: ${eventFile.split('\\').slice(-1)[0]}`)
        }
        // Include event script
        const eventFunction = require(eventFile)
        // Run event script
        await eventFunction(client, ...args) // Pass all arguments to the event function
      }
    })
  }
}
