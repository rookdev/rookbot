const { ApplicationCommandOptionType } = require('discord.js')
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
            { name: "Zelda: Dungeons of Infinity", value: "doi" },
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
  async action(client, interaction, coptions) {
    let helpJSON = require('../../res/app/manifests/help/help.json')
    let command = coptions["command-name"] ?? null
    let section = coptions["section-name"] ?? null

    this.props.description = " "

    if(command) {
      for(let [sectionName, sectionCmds] of Object.entries(helpJSON)) {
        if(command in sectionCmds) {
          let thisJSON = {}
          thisJSON[sectionName] = {}
          thisJSON[sectionName][command] = sectionCmds[command]
          helpJSON = thisJSON
        }
      }
    } else if(section) {
      let thisJSON = {}
      thisJSON[section] = helpJSON[section]
      helpJSON = thisJSON
    }

    for(let [sectionName, sectionCmds] of Object.entries(helpJSON)) {
      for(let [cmdName, cmd] of Object.entries(sectionCmds)) {
        let fields = [
          [
            {
              name: "Name",
              value: `\`/${cmd.name}\``
            },
            {
              name: "Category",
              value: `\`${cmd.category}\``
            }
          ],
          [
            {
              name: "Description",
              value: cmd.description || " "
            }
          ]
        ]
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
        if(cmd?.options && cmd.options.length > 0) {
          for(let [optionID, option] of Object.entries(cmd.options)) {
            if (option && option?.name) {
              let optionName = `Option: \`${option.name}\``
              if (option?.required && option.required) {
                optionName += " - *required*"
              }
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

        let props = {
          title: { text: `Help - ${sectionName} - ${cmdName}` },
          description: " ",
          fields: fields
        }
        this.pages.push(props)
      }
    }

    return this.pages.length > 0 && !this.error
  }
}
