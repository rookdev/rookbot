// @ts-nocheck

// Command Option Types
const { ApplicationCommandOptionType } = require('discord.js')
// AdminCommand
const { AdminCommand } = require('../../classes/command/admincommand.class')
const getLocalCommands = require('../../utils/client/getLocalCommands')
const mentionFuncs = require('../../utils/formatters/mentions')
const getters = require('../../utils/guild/getters')

module.exports = class DeleteCommandCommand extends AdminCommand {
  constructor(client) {
    let comprops = {
      name: "delcommand",
      category: "admin",
      description: "Delete a Command",
      options: [
        {
          name: "command-name",
          description: "Command Name",
          type: ApplicationCommandOptionType.String,
          required: true
        },
        {
          name: "scope",
          description: "Scope?",
          type: ApplicationCommandOptionType.String,
          required: true,
          choices: [
            { name: "Development", value: "development" },
            { name: "Production", value: "production" }
          ]
        }
      ]
    }
    let props = {}

    super(
      client,
      {...comprops},
      {...props}
    )
  }

  // declare props: import('../../types/embed').EmbedProps

  async action(client, interaction, coptions) {
    let cmdName = coptions["command-name"] ?? null
    
    const localCommands = getLocalCommands(client)
    
    let isDevelopment = !coptions["scope"].startsWith('prod')
    let commandsManager = null

    if (isDevelopment) {
      const testGuildID = process.env.GUILD_ID
      const testGuild = await getters.getCache(client, client, "guilds", testGuildID)
      if (!testGuild) {
        this.error = true
        this.messages.push(`${client.profile.emojis.fail} Test guild not found: ${testGuildID}`)
        return !this.error
      }
      this.messages.push(`${client.profile.emojis.devText} Managing development mode. Loading Guild Commands of: ${mentionFuncs.guildMention(testGuild.name, testGuildID, { showID: true, textOnly: true, oneLine: true })}`)
      commandsManager = testGuild.commands
    } else {
      this.messages.push(`${client.profile.emojis.prodText} Managing production mode. Loading Global Commands.`)
      commandsManager = client.application.commands
    }

    const applicationCommands = await commandsManager.fetch()

    const existingCommand = applicationCommands.find(
      cmd => cmd.name === cmdName
    )

    if (existingCommand) {
      this.messages.push(`${client.profile.emojis.delete} Deleting: "${existingCommand.name}"`)
      try {
        await commandsManager.delete(existingCommand.id)
      } catch (error) {
        this.error = true
        this.messages.push(`${client.profile.emojis.fail} Failed to delete: "${existingCommand.name}":`, error.message)
      }
    } else {
      this.messages.push(`${client.profile.emojis.no} Command not found: "${cmdName}"`)
    }

    return !this.error
  }
}
