// @ts-nocheck

const { ApplicationCommandOptionType, ChatInputCommandInteraction } = require('discord.js');
const { BotDevCommand } = require('../../classes/command/botdevcommand.class')
const { RookClient } = require('../../classes/objects/rclient.class')
const getLocalCommands = require('../../utils/getLocalCommands')

module.exports = class TestSuiteCommand extends BotDevCommand {
  constructor(client) {
    let comprops = {
      name: "testsuite",
      category: "botdev",
      description: "Runs a test suite for a command",
      flags: {
        user: "unapplicable",
        target: "unapplicable",
        mention: "unapplicable",
        bot: "unapplicable"
      },
      options: [
        {
          name: "command-name",
          description: "The name of the command to test.",
          type: ApplicationCommandOptionType.String,
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

  async action(client, interaction, coptions={}) {
    console.log(`/${this.name}: Action`)
    const localCommands = getLocalCommands(client)
    let commandName = coptions["command-name"]

    try {
      // Find the command
      const commandObject = localCommands.find(
        cmd => cmd.name === commandName
      )

      // Return if couldn't find it
      if (!commandObject) {
        console.log(`Couldn't find /${commandName}`)
        this.error = true
        this.props.description = `Couldn't find /${commandName}`
        return !this.error
      }

      // If UserPermissions
      if (commandObject.permissionsRequired?.length) {
        for (const permission of commandObject.permissionsRequired) {
          // If we're missing one, abort
          // @ts-ignore
          if (!interaction?.member?.permissions.has(permission)) {
            console.log(`/${commandName} attempted without proper user perms`)
            await interaction?.reply({
              content: 'User is missing permissions.',
              ephemeral: true
            })
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
              console.log(`/${commandName} attempted without proper bot perms`)
              await interaction.reply({
                content: "I don't have enough permissions.",
                ephemeral: true
              })
              this.error = true
              return !this.error
            }
          }
        }
      }

      // Run the test function
      console.log(`/${this.name}/${commandObject.name}`)
      await commandObject.test(client, interaction);
    } catch (error) {
      console.log(`There was an error running this command: ${error.stack}`);
    }
    this.null = true

    return true
  }
}
