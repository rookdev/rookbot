// @ts-nocheck

// Formatters: codeBlock, inlineCode, bold, userMention
const { ChannelType, codeBlock, inlineCode, bold, userMention } = require('discord.js')
// Base Rook Command
const { RookCommand } = require('../../classes/command/rcommand.class')
const mentionFuncs = require('../../utils/formatters/mentions')
const globalFuncs = require('../../utils/primitives/globalFuncs')

module.exports = class GuildWebhooksCommand extends RookCommand {
  constructor(client) {
    let comprops = {
      name: "guildwebhooks",
      category: "guild",
      description: "Guild Webhooks",
      flags: {
        test: "basic"
      },
      platforms: ["discord", "stoat"]
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

  // declare props: import('../../types/embed').EmbedProps

  async action(client, interaction, coptions={}) {
    let interactionGuild = await this.getGuild(client, interaction)
    if (!interactionGuild) {
      this.error = true
      this.props.description = "Command must be run in guild."
      return false
    }

    // Set EmbedPlayerTypes to Bot|Guild
    this.props.playerTypes = {
      user: "bot",
      target: "guild"
    }

    let hookCache = await interactionGuild.fetchWebhooks()

    this.props.description = []
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
