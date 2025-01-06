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
      let showDateTime  = true
      let showEvent     = true
      let showScript    = true
      let firstScript   = true

      // Cycle through event scripts
      for (const eventFile of eventFiles) {
        /**
         * Don't push these notifications to console for:
         *  interactionCreate
         *  messageUpdate
         */
        if (
          [
            "interactionCreate"
          ].includes(eventFile)
        ) {
          continue
        }

        // Skip it if it's *.off
        if (eventFile.endsWith(".off")) {
          continue
        }

        // Include event script
        const eventFunction = require(eventFile)
        // Run event script
        if (false) {
          console.log(
            {
              event: eventName,
              script: eventFile
            }
          )
        }

        let [result, messages] = await eventFunction(client, ...args) // Pass all arguments to the event function

        if (messages.length) {
          if (showDateTime && showScript && firstScript) {
            // Print DateTime
            console.log(new Date().toISOString())
            showDateTime = false
          }
          if (showEvent && showScript && firstScript) {
            // Print eventName
            console.log(` Event: ${eventFolder.split(path.sep).slice(-1)[0]}`)
            showEvent = false
          }
          if (showScript) {
            // Print scriptName
            console.log(`  Script: ${eventFile.split(path.sep).slice(-1)[0]}`)
          }
          console.log(
            messages.map(
              m => "   " + m
            ).join("\n")
          )
        }
      }
    })
  }
}
