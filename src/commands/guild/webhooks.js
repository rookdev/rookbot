const { inlineCode, bold } = require('discord.js')
const { RookCommand } = require('../../classes/command/rcommand.class')
const mentionFuncs = require('../../utils/formatters/mentions')

module.exports = class GuildWebhooksCommand extends RookCommand {
  constructor(client) {
    let comprops = {
      name: "webhooks",
      description: "Guild Webhooks",
      flags: {
        domain: [
          "guild"
        ]
      }
    }
    let props = {
      title: {
        text: "Guild Webhooks"
      }
    }

    super(
      client,
      {...comprops},
      {...props}
    )
  }

  async action(client, interaction, coptions={}) {
    let interactionGuild = await this.getGuild(client, interaction)
    if (!interactionGuild) {
      this.error = true
      this.props.description = "Subcommand must be run in guild."
      return false
    }

    let hookCache = await interactionGuild.fetchWebhooks()

    this.props.title.text = `Guild Webhooks for ${interactionGuild.name}`
    this.props.description = []
    this.props.description.push(bold("Guild"))
    this.props.description.push(mentionFuncs.guildMention(interactionGuild.name, interactionGuild.id, { showID: true }))
    this.props.description.push("")

    for (let [hID, hook] of hookCache) {
      this.props.description.push(
        inlineCode(hID) + ': ' +
        "'" + hook.name + "': " +
        mentionFuncs.channelMention(hook.channel.id)
      )
    }

    return !this.error
  }
}
