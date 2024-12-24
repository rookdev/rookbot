// @ts-nocheck

const { PermissionFlagsBits } = require('discord.js')
const { ModCommand } = require('../../classes/command/modcommand.class')

module.exports = class ClearCommand extends ModCommand {
  constructor(client) {
    let comprops = {
      name: "clear",
      category: "mod",
      description: "Clear Messages",
      permissions: [ PermissionFlagsBits.ManageMessages ]
    }
    let props = {}

    super(
      client,
      {...comprops},
      {...props}
    )
  }

  async action(client, interaction, coptions={}) {
    this.props.title = {
      text: "Clearing messages..."
    }
    this.props.description = ""

    let duration = "5s"
    let limit = 100
    if(!this.DEV) {
      await interaction.channel.messages.fetch( {
        limit: limit
      })
      .then(messages => {
        interaction.channel.bulkDelete(messages)
      })
      this.props.description = `Clearing ${limit} messages in ${duration}.`
    } else {
      this.props.description = (this.DEV ? "DEV: " : "") + `Clearing ${limit} messages in ${duration}.`
    }

    return true
  }
}
