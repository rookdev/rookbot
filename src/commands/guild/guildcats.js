// @ts-nocheck

// Formatters: codeBlock, inlineCode, bold, userMention
const { ChannelType, codeBlock, inlineCode, bold, userMention } = require('discord.js')
// Base Rook Command
const { RookCommand } = require('../../classes/command/rcommand.class')

module.exports = class GuildCatsCommand extends RookCommand {
  constructor(client) {
    let comprops = {
      name: "guildcats",
      category: "guild",
      description: "Guild Categories",
      flags: {
        test: "basic"
      }
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

    // Set EmbedPlayerTypes to Bot|Guild
    this.props.playerTypes = {
      user: "bot",
      target: "guild"
    }

    let channels = []
    let chanCache = interactionGuild.channels.cache
    if (["stoat"].includes(client.platform)) {
      chanCache = interactionGuild.categories
    }
    for (let [cID, channel] of chanCache) {
      if (
        (channel.type == ChannelType.GuildCategory) ||
        (channel?.children?.size > 0)
      ) {
        if (channel?.position) {
          channels[channel.position] = channel
        } else {
          channels.push(channel)
        }
      }
    }

    this.props.description = []
    for (let channel of channels) {
      if (channel) {
        this.props.description.push(`${inlineCode(channel.id)}: ${channel.name}`)
      }
    }

    return !this.error
  }
}
