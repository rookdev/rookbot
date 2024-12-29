// @ts-nocheck

// Canned metadata
const { serverGameName_base64encoded } = require('../../../config.json')
// Command Option Types
const { ApplicationCommandOptionType } = require('discord.js')
// Base Rook Command
const { RookCommand } = require('../../classes/command/rcommand.class.js')

/**
 * @class
 * @classdesc App Help
 * @this {HelpCommand}
 * @extends {RookCommand}
 * @public
 */
module.exports = class HelpCommand extends RookCommand {
  constructor(client) {
    const serverGameName = Buffer.from(serverGameName_base64encoded, 'base64').toString('utf-8')

    let comprops = {
      name: "help",
      category: "app",
      description: "Help",
      options: [
        {
          name: "section-name",
          description: "Section Name",
          type: ApplicationCommandOptionType.String,
          choices: [
            { name: "Application",  value: "app" },
            { name: "Bot",          value: "bot" },
            { name: "Diagnostics",  value: "diagnostic" },
            { name: serverGameName, value: "doi" },
            { name: "Fun",          value: "fun" },
            { name: "Information",  value: "info" },
            { name: "Meta",         value: "meta" },
            { name: "Miscellaneous",value: "misc" },
            { name: "Moderation",   value: "mod" },
            { name: "Randomizers",  value: "rando" },
            { name: "Unsorted",     value: "undefined" }
          ]
        },
        {
          name: "command-name",
          description: "Command Name",
          type: ApplicationCommandOptionType.String
        }
      ],
      testOptions: [
        {},
        { "section-name": "app" },
        { "command-name": "diceroll" },
        { "section-name": "moo", "assert": false },
        { "command-name": "moo", "assert": false }
      ],
      testIndependent: true
    }
    let props = {
      title: { text: "Help", emoji: "?" }
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
    let helpJSON = require('../../res/app/manifests/help/help.json')
    let command = coptions["command-name"] ?? null  // Get Command Name
    let section = coptions["section-name"] ?? null  // Get Section Name
    let showJSON = {} // Bucket for data to show

    this.props.description = " "

    // If we've called for a command
    if(command) {
      // Cycle through sections
      for(let [sectionName, sectionCmds] of Object.entries(helpJSON)) {
        // If the command is here
        if(command in sectionCmds) {
          // Set that to the data to show
          let thisJSON = {}
          thisJSON[sectionName] = {}
          thisJSON[sectionName][command] = sectionCmds[command]
          showJSON = thisJSON
        }
      }
    } else if(section) {
      // Else, if we've called for a section
      // Set that to the data to show
      let thisJSON = {}
      thisJSON[section] = helpJSON[section]
      showJSON = thisJSON
    } else {
      // Else, show it all
      showJSON = {...helpJSON}
    }

    // Cycle through sections
    for(let [sectionName, sectionCmds] of Object.entries(showJSON)) {
      // Cycle through commands
      for(let [cmdName, cmd] of Object.entries(sectionCmds)) {
        let fields = [
          [
            // Command Name
            {
              name: "Name",
              value: `\`/${cmd.name}\``
            },
            // Command Category
            {
              name: "Category",
              value: `\`${cmd.category}\``
            }
          ],
          [
            // Command Description
            {
              name: "Description",
              value: cmd.description || " "
            }
          ]
        ]

        // If we've set the Command Access, note it
        if (cmd?.access && cmd.access.toLowerCase() != "unset") {
          fields.push(
            [
              {
                name: "Access",
                value: cmd.access
              }
            ]
          )
        }

        // If the command has options, list them
        if(cmd?.options && cmd.options.length > 0) {
          // Cycle through options
          for(let [optionID, option] of Object.entries(cmd.options)) {
            // If we've got an option and it's got a name
            if (option && option?.name) {
              // Set the name
              let optionName = `Option: \`${option.name}\``
              if (option?.required && option.required) {
                optionName += " - *required*"
              }
              // Add the name & description
              fields.push(
                [
                  {
                    name: optionName,
                    value: option.description || " "
                  }
                ]
              )
            }
          }
        }

        // Set title to include Section Name & Command Name
        let props = {
          title: { text: `Help - ${sectionName} - ${cmdName}` },
          description: " ",
          fields: fields
        }

        // Push this page
        this.pages.push(props)
      }
    }

    return this.pages.length > 0 && !this.error
  }
}
