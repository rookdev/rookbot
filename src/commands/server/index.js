const { RookCommand } = require('../../classes/command/rcommand.class')
const ServerCatsCommand     = require('./categories')
const ServerFeaturesCommand = require('./features')
const ServerMembersCommand  = require('./members')
const ServerRolesCommand    = require('./roles')
const ServerStatusCommand   = require('./status')
const ServerWebhooksCommand = require('./webhooks')

module.exports = class ServerIndexCommand extends RookCommand {
  constructor(client) {
    let comprops = {
      name: "server",
      description: "Server Commands"
    }
    let props = {
      title: {
        text: "Server Commands"
      }
    }

    super(
      client,
      {...comprops},
      {...props}
    )
  }

  async action(client, interaction, coptions={}) {
    let subcommand = interaction?.options?.getSubcommand()
    if (subcommand) {
      let subCmd = null
      switch(subcommand) {
        case "categories":
          subCmd = new ServerCatsCommand(client)
          break
        case "features":
          subCmd = new ServerFeaturesCommand(client)
          break
        case "members":
          subCmd = new ServerMembersCommand(client)
          break
        case "roles":
          subCmd = new ServerRolesCommand(client)
          break
        case "status":
          subCmd = new ServerStatusCommand(client)
          break
        case "webhooks":
          subCmd = new ServerWebhooksCommand(client)
          break
      }
      if (subCmd) {
        await subCmd.execute(client, interaction, coptions)
        this.null = true
      }
    }
  }
}
