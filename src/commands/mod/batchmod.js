// @ts-nocheck

// Command Option Types
const { ApplicationCommandOptionType } = require('discord.js')
// BotDevCommand
const { BotDevCommand } = require('../../classes/command/botdevcommand.class')
// Get Local Commands
const getLocalCommands = require('../../utils/client/getLocalCommands')
const fileFuncs = require('../../utils/fs/fileFuncs')
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))

module.exports = class BatchModCommand extends BotDevCommand {
  constructor(client) {
    let comprops = {
      name: "batchmod",
      category: "mod",
      description: "Runs a batch of Mod commands",
      flags: {
        user: "unapplicable",
        target: "unapplicable",
        mention: "unapplicable",
        bot: "unapplicable"
      },
      options: [
        {
          name: "batchlist",
          description: "A text file with a list of batch commands.",
          type: ApplicationCommandOptionType.Attachment,
          required: true
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

  async find_command(interaction, localCommands, commandName) {
    try {
      // Find the command
      const commandObject = localCommands.find(
        cmd => cmd.name === commandName
      )

      // Return if couldn't find it
      if (!commandObject) {
        this.messages.push(`Couldn't find /${commandName}`)
        this.error = true
        this.props.description = `Couldn't find /${commandName}`
        return !this.error
      }

      // If UserPermissions
      if (commandObject.userPermissions?.length) {
        for (const permission of commandObject.userPermissions) {
          // If we're missing one, abort
          // @ts-ignore
          if (!interaction?.member?.permissions.has(permission)) {
            this.messages.push(`/${commandName} attempted without proper user perms`)
            let intOptions = {
              content: `${this.profile.emojis.user} User is missing permissions.`,
              flags: MessageFlags.Ephemeral
            }
            await interaction?.reply(intOptions)
            this.error = true
            return !this.error
          }
        }
      }

      // If BotPermissions
      if (commandObject.botPermissions?.length) {
        for (const permission of commandObject.botPermissions) {
          const bot = interaction?.guild?.members.me
          if (bot) {
            // If we're missing one, abort
            if (!bot.permissions.has(permission)) {
              this.messages.push(`/${commandName} attempted without proper bot perms`)
              let intOptions = {
                content: `${this.profile.emojis.bot} Bot is missing permissions.`,
                flags: MessageFlags.Ephemeral
              }
              await interaction?.reply(intOptions)
              this.error = true
              return !this.error
            }
          }
        }
      }
      return commandObject
    } catch(error) {
      this.messages.push(`There was an error running this command: ${error.stack}`)
      return false
    }
  }

  async action(client, interaction, coptions={}) {
    this.messages.push(`/${this.name}: BatchMod Action`)

    // Get Local Commands
    const localCommands = getLocalCommands(client)
    // Get requested Command Name
    let commandName = coptions["command-name"] ?? "ping"
    let batchFile = interaction.options.getAttachment("batchlist")
    let batchList = await fileFuncs.getAURL(batchFile.attachment, "txt")

    let batchLines = batchList.split("\n")
    // Get full document
    // First line is command name
    // Next line is JSON object of options to send
    // Next line is first of list of names to act on
    // When '---' start new command

    try {
      let newCommand = false
      let getParams = false
      commandName = batchLines.shift()
      let bOptions = JSON.parse(batchLines.shift())
      let commandObject = await this.find_command(interaction, localCommands, commandName)
      // Run the mod function
      this.messages.push(`/${this.name}/${commandObject.name}`)
      this.messages.push(" " + JSON.stringify(bOptions))
      for (let batchLine of batchLines) {
        batchLine = batchLine.trim()
        // Get JSON params
        // Get new Command object
        if (getParams) {
          commandObject = await this.find_command(interaction, localCommands, commandName)
          bOptions = JSON.parse(batchLine)
          this.messages.push(" ")
          this.messages.push(`/${this.name}/${commandObject.name}`)
          this.messages.push(" " + JSON.stringify(bOptions))
          getParams = false
        }
        // Get new Command name
        if (newCommand) {
          commandName = batchLine
          newCommand = false
          getParams = true
        }
        // Start of new command
        if (batchLine == "---") {
          newCommand = true
          commandObject = null
        }
        // Process names
        if (commandObject) {
          let username = batchLine
          if (username != "") {
            let targetMember = await this.getCache(client, guild, "members", username)
            if (targetMember) {
              bOptions["target-id"] = targetMember.user.id
              bOptions["bypass"] = true
              this.messages.push(`  ${username}`)
              await commandObject.action(client, interaction, bOptions)
            }
            // Wait half a second after submitting action
            await wait(0.5 * 1000)
          }
        }
      }
    } catch (error) {
      this.messages.push(`There was an error running this command: ${error.stack}`)
    }
    this.null = true

    return true
  }
}
