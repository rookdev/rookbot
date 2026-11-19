// @ts-nocheck

// Formatters: codeBlock, inlineCode, bold, userMention
const { ChannelType, codeBlock, inlineCode, bold, userMention } = require('discord.js')
// Base Rook Command
const { RookCommand } = require('../../classes/command/rcommand.class')
const mentionFuncs = require('../../utils/formatters/mentions')
const globalFuncs = require('../../utils/primitives/globalFuncs')

module.exports = class GuildCatsCommand extends RookCommand {
  constructor(client) {
    let comprops = {
      description: "Guild Categories",
      playerTypes: {
        user:   "bot",
        target: "guild"
      },
      platforms: ["discord", "stoat"]
    }
    let props = {
      title: {
        text: "Guild Categories"
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

    this.props.description = []
    this.props.description.push(bold("Guild"))
    this.props.description.push(mentionFuncs.guildMention(interactionGuild.name, interactionGuild.id, { showID: true }))
    this.props.description.push("")

    let channels = []
    let chanCache = interactionGuild.channels.cache
    if (globalFuncs.isStoat(client)) {
      chanCache = interactionGuild.categories
    }

    for (let [cID, channel] of chanCache) {
      if (
        (channel.type == ChannelType.GuildCategory) ||
        (channel?.children?.size > 0)
      ) {
        if (channel?.rawPosition) {
          channels[channel.rawPosition] = channel
        } else {
          channels.push(channel)
        }
      }
    }

    for (let channel of channels) {
      if (channel) {
        this.props.description.push(`${inlineCode(channel.id)}: ${channel.name}`)
      }
    }

    return !this.error
  }
}
