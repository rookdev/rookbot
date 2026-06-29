// @ts-nocheck

// Formatters: userMention
const { userMention, inlineCode, codeBlock, ApplicationCommandOptionType, OverwriteType, italic } = require('discord.js')
// AdminCommand
const { AdminCommand } = require('../../classes/command/admincommand.class')
const getLocalCommands = require('../../utils/client/getLocalCommands')
const mentionFuncs = require('../../utils/formatters/mentions')
const AsciiTable = require('ascii-table')
const getters = require('../../utils/guild/getters')
const dbFuncs = require('../../utils/db/dbFuncs')
const moment = require('moment')

/**
 * @class
 * @classdesc
 * @this ListCommandsCommand}
 * @extends {AdminCommand}
 * @public
 */
module.exports = class ListCommandsCommand extends AdminCommand {
  constructor(client) {
    let comprops = {
      name: "listcommands",
      category: "admin",
      description: "List Commands",
      options: [
        {
          name: "domain",
          description: "Commands Domain",
          type: ApplicationCommandOptionType.String,
          choices: [
            {
              name: "Global",
              value: "global"
            },
            {
              name: "Test",
              value: "test"
            },
            {
              name: "Local",
              value: "local"
            },
            {
              name: "Universal",
              value: "universal"
            }
          ]
        }
      ]
    }
    let props = {
      title: {
        text:   "List Commands"
      }
    }

    super(
      client,
      {...comprops},
      {...props}
    )
  }

  // declare props: import('../../types/embed').EmbedProps

  async extractCommand(command) {
    let {
      name,
      category,
      description,
      options = [],
      access,
      aliases,
      deleted
    } = await command

    return {
      name,
      category,
      description,
      options,
      access,
      aliases,
      deleted
    }
  } 

  async action(client, interaction, coptions={}) {
    let domain = coptions["domain"] ?? "universal"

    let localCommands = null
    let testCommands = null
    let globalCommands = null
    let baseDomain = ""
    let commands = {
      local:  {},
      test:   {},
      global: {}
    }

    if (["global","universal"].includes(domain)) {
      // Get Global Commands
      let globalManager = client.application.commands
      globalCommands = await globalManager.fetch()
      if (globalCommands) {
        baseDomain = "global"
        for (let [cmdId, cmd] of globalCommands) {
          if (cmd) {
            commands.global[cmd.name] = {
              name: cmd.name,
              description: cmd.description
            }
          }
        }
      }
    }
    if (["test","universal"].includes(domain)) {
      const testGuildID = process.env.GUILD_ID
      const testGuild = await getters.getCache(client, client, "guilds", testGuildID)

      if (testGuild) {
        let testManager = testGuild.commands
        testCommands = await testManager.fetch()
        if (testCommands) {
          baseDomain = "test"
          for (let [cmdId, cmd] of testCommands) {
            if (cmd) {
              commands.test[cmd.name] = {
                name: cmd.name,
                description: cmd.description
              }
            }
          }
        }
      }
    }
    if (["local","universal"].includes(domain)) {
      // Get Local Commands
      localCommands = getLocalCommands(client)
      if (localCommands) {
        baseDomain = "local"
        for (let command of localCommands) {
          if (command) {
            let cmdParts = await this.extractCommand(command)
            commands.local[cmdParts.name] = cmdParts
          }
        }
      }
    }

    let Table = new AsciiTable(
      "Commands",
      {}
    )
      .setBorder()
      .setHeading(
        "Command",
        "Category",
        "Test ",
        "Local",
        "Global",
        "Description"
      )
    let cmdOrder = Object.keys(commands[baseDomain])
    if (baseDomain != "local") {
      cmdOrder.sort()
    }
    for (let cmdName of cmdOrder) {
      let cmdParts = commands[baseDomain][cmdName]
      Table.addRow(
        cmdParts?.name,
        cmdParts?.category,
        Object.keys(commands.test).includes(cmdParts?.name)   ? "⚙️" : "",
        Object.keys(commands.local).includes(cmdParts?.name)  ? "💾" : "",
        Object.keys(commands.global).includes(cmdParts?.name) ? "🌎" : "",
        cmdParts?.description
      )
    }
    console.log(Table.toString())
  }
}
