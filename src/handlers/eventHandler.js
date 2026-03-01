// @ts-nocheck
const stringFuncs = require('../utils/primitives/stringFuncs')
const fileFuncs = require('../utils/fs/fileFuncs') // Get All Files
const moment = require('moment')
const path = require('path')                       // Easy filepath management

module.exports = (client) => {
  // Get all folders in ./events
  const eventFolders = fileFuncs.getAllFiles(
    [
      "src",
      "events"
    ],
    true
  )

  // Cycle through folders
  for (const eventFolder of eventFolders) {
    // Get event scripts
    let eventFiles = fileFuncs.getAllFiles(eventFolder)
    // Sort event scripts
    eventFiles = eventFiles.sort()

    // Get event name based on folder
    const eventName = eventFolder.replace(/\\/g, '/').split('/').pop()

    if (client.eventNames.includes(eventName)) {
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

          let handled = false
          let eventObject = require(eventFile)

          if (eventObject) {
            if (eventObject?.name) {
              if (eventObject.name.includes("Event")) {
                // Handle OOP
                let evt = new eventObject(client)
                let result = await evt.execute(client, ...args)
                handled = true
              }
            }
          }

          if (!handled) {
            // Handle inline
            let [result, messages] = await eventObject(client, ...args) // Pass all arguments to the event function

            if (messages.length) {
              if (showDateTime && showScript && firstScript) {
                // Print DateTime
                let now = moment.utc()
                let dateStamp = ""
                now.utc()
                dateStamp += now.format()
                dateStamp += " | "
                now.local()
                dateStamp += now.format()
                console.log(dateStamp)
                showDateTime = false
              }
              if (showEvent && showScript && firstScript) {
                // Print Platform
                console.log(` ${client.profile.emojis[client.platform]} Platform: ${client.platform.ucfirst()}`)
                // Print eventName
                console.log(`  Event: ${eventFolder.split(path.sep).slice(-1)[0]}`)
                showEvent = false
              }
              if (showScript) {
                // Print scriptName
                console.log(`   Script: ${eventFile.split(path.sep).slice(-1)[0]}`)
              }
              console.log(
                messages.map(m=>"    " + m).join("\n")
              )
            }
          }
        }
      })
    }
  }
}
