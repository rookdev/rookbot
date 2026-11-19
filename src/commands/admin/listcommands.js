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
      ],
      playerTypes: {
        user:   "bot",
        target: "bot"
      }
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
    let instanceProto   = Object.getPrototypeOf(command)
    let parentProto     = Object.getPrototypeOf(instanceProto)
    if (
      [
        "SalutationCommand"
      ].includes(parentProto.constructor.name)
    ) {
      parentProto = Object.getPrototypeOf(parentProto)
    }
    command.instanceClassName = instanceProto.constructor.name
    command.parentClassName   = parentProto.constructor.name

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
      deleted,
      instanceClassName:  command.instanceClassName,
      parentClassName:    command.parentClassName
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
      const testGuild = await getters.getCachedGuild(client, testGuildID)

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
      localCommands = await getLocalCommands(client)
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
        "Index",
        "Command",
        "Category",
        "Parent",
        "Test ",
        "Local",
        "Global",
        "Description"
      )
    let cmdOrder = Object.keys(commands[baseDomain])
    if (baseDomain != "local") {
      cmdOrder.sort()
    }
    let cmdCount = 0
    for (let cmdName of cmdOrder) {
      let cmdParts = commands[baseDomain][cmdName]
      cmdCount += 1
      Table.addRow(
        cmdCount,
        cmdParts?.name,
        cmdParts?.category,
        cmdParts?.parentClassName,
        Object.keys(commands.test).includes(cmdParts?.name)   ? client.profile.emojis.dev   : "",
        Object.keys(commands.local).includes(cmdParts?.name)  ? client.profile.emojis.disk  : "",
        Object.keys(commands.global).includes(cmdParts?.name) ? client.profile.emojis.prod  : "",
        cmdParts?.description
      )
    }
    this.messages.push(Table.toString())
  }
}
