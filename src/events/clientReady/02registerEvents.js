// @ts-nocheck
const { GatewayDispatchEvents, SimpleShardingStrategy } = require('discord.js')
const globalFuncs = require('../../utils/primitives/globalFuncs')
const stringFuncs = require('../../utils/primitives/stringFuncs')
const fileFuncs = require('../../utils/fs/fileFuncs') // Get All Files
const moment = require('moment')
const path = require('path')                       // Easy filepath management
const fs = require('fs/promises')

let helpDoc = {}

module.exports = async (client) => {
  let result = false
  let messages = []

  console.log(`${client.profile.emojis[client.platform]} ${client.platform.ucfirst()} Register Events Help`)
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
      // console.log(` ${eventName}`)
      let internalEventName = eventName
      // if (globalFuncs.isFluxer(client)) {
      //   internalEventName = GatewayDispatchEvents[eventName.ucfirst()]
      // }
      if (internalEventName) {
        // console.log(`  ${internalEventName}`)

        if (globalFuncs.isFluxer(client)) {
          // console.log(
          //   {
          //     eventName,
          //     internalEventName,
          //     platform: client.platform,
          //     args
          //   }
          // )
        }

        let message = eventName + ": "

        // Cycle through event scripts
        for (const eventFile of eventFiles) {
          // Skip it if it's *.off
          if (eventFile.endsWith(".off")) {
            continue
          }

          // console.log(` ${eventFile}`)

          let handled = false
          let eventObject = require(eventFile)

          if (eventObject) {
            if (eventObject?.name) {
              if (eventObject.name.includes("Event")) {
                // Handle OOP
                // console.log(`  ${eventObject.name}`)
                let evt = new eventObject(client)
                if (message != (eventName + ": ")) {
                  message += ", "
                }
                message += evt.name

                if (!(evt.event in helpDoc)) {
                  helpDoc[evt.event] = {}
                }
                helpDoc[evt.event][evt.name] = {
                  label: evt.label,
                  description: evt.description,
                  platforms: evt.platforms
                }
                handled = true
              }
            }
          }
        }
        messages.push(message)
      }
    }
  }

  await fs.writeFile(
    "./src/res/app/manifests/help/events.json",
    (
      JSON.stringify(
        helpDoc,
        null,
        2
      ) +
      "\n"
    ).replace(/\n/g, "\r\n")
  )

  return [result, messages]
}
