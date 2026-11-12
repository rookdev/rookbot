// @ts-nocheck

// Canned metadata
const { serverGameName_base64encoded } = require('../../../config.json')
/**
 * Discord Stuff
 *  Command Option Types
 *  inlineCode
 *  italic
 */
const {
  ApplicationCommandOptionType,
  inlineCode,
  italic
} = require('discord.js')
// Base Rook Command
const { RookCommand } = require('../../classes/command/rcommand.class')
const globalFuncs = require('../../utils/primitives/globalFuncs')

/**
 * @class
 * @classdesc Events Help
 * @this {ListEventsCommand}
 * @extends {RookCommand}
 * @public
 */
module.exports = class ListEventsCommand extends RookCommand {
  constructor(client) {
    let comprops = {
      name: "listevents",
      category: "botmeta",
      description: "Events Help",
      options: [
        {
          name: "event-name",
          description: "Event Name",
          type: ApplicationCommandOptionType.String
        },
        {
          name: "script-name",
          description: "Script Name",
          type: ApplicationCommandOptionType.String
        }
      ],
      platforms: ["discord"],
      testOptions: [
        {},
        { "event-name": "guildMemberAdd" },
        { "script-name": "logMemberJoin" },
        { "event-name": "moo", "assert": false },
        { "script-name": "moo", "assert": false }
      ],
      testIndependent: true
    }
    let props = {
      title: { text: "Events Help", emoji: "?" }
    }
    super(
      client,
      {...comprops},
      {...props}
    )
  }

  // declare props: import('../../types/embed').EmbedProps

  async action(client, interaction, coptions) {
    // Load Help file
    let eventJSON = require('../../res/app/manifests/help/events.json')
    let event = coptions["event-name"] ?? null  // Get Event Name
    let script = coptions["script-name"] ?? null  // Get Script Name
    let showJSON = {} // Bucket for data to show

    this.props.description = " "

    // If we've called for a script
    if(script) {
      // Cycle through sections
      for(let [eventName, eventScripts] of Object.entries(eventJSON)) {
        // If the script is here
        if(command in eventScripts) {
          // Set that to the data to show
          let thisJSON = {}
          thisJSON[eventName] = {}
          thisJSON[eventName][script] = eventScripts[command]
          showJSON = thisJSON
        }
      }
    } else if(event) {
      // Else, if we've called for a section
      // Set that to the data to show
      let thisJSON = {}
      thisJSON[event] = eventJSON[event]
      showJSON = thisJSON
    } else {
      // Else, show it all
      // NOT FOR STOAT ZOMG
      if (!globalFuncs.isStoat(client)) {
        showJSON = {...eventJSON}
      }
    }

    // Cycle through sections
    for(let [eventName, eventScripts] of Object.entries(showJSON)) {
      // Cycle through commands
      if(eventScripts) {
        for(let [scriptName, script] of Object.entries(eventScripts)) {
          let fields = []
          fields.push(
            [
              // Script Label
              {
                name: "Script Label",
                value: script.label
              },
              // Event
              {
                name: "Event",
                value: inlineCode(eventName)
              }
            ]
          )

          fields.push(
            [
              // Command Description
              {
                name: "Description",
                value: script?.description ?? " "
              }
            ]
          )

          // Set title to include Section Name & Command Name
          let props = {
            title: { text: `Event - ${eventName} - ${scriptName}` },
            description: " ",
            fields: fields,
            playerTypes: { user: "bot", target: "bot" }
          }

          // Push this page
          this.pages.push(props)
        }
      }
    }

    return this.pages.length > 0 && !this.error
  }
}
