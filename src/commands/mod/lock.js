// @ts-nocheck

// Command Option Types, Permission Flags, Formatters: bold, inlineCode
const { ApplicationCommandOptionType, PermissionFlagsBits, bold, inlineCode } = require('discord.js')
const { RookMessage } = require('../../classes/objects/rmessage.class')
// ModCommand
const { ModCommand } = require('../../classes/command/modcommand.class')
// Base Rook Embed
const { RookEmbed } = require('../../classes/embed/rembed.class')
const mentionFuncs = require('../../utils/formatters/mentions')

// Multiple messages

module.exports = class LockCommand extends ModCommand {
  constructor(client) {
    let comprops = {
      name: "lock",
      category: "mod",
      description: "Locks a channel, preventing anyone from sending messages.",
      options: [
        {
          name: "channel",
          description: "The channel to lock.",
          type: ApplicationCommandOptionType.Channel,
          required: true
        }
      ],
      permissions: [ PermissionFlagsBits.ManageChannels ]
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
    // Get Guild ID
    const guildID = interaction.guild.id
    // Get requested Channel ID
    const channelID = coptions['channel']
    // Get Channel from Guild based on Channel ID
    const channel = await this.getCache(client, client, "channels", channelID)

    try {
      if (!this.DEV) {
        // Lock the channel by denying SEND_MESSAGES for @everyone
        await channel.permissionOverwrites.edit(
          interaction.guild.roles.everyone, {
            SendMessages: false,
          }
        )
      }

      // Send public confirmation in the channel
      const embedProps = {
        color: this.profile.colors.bad,
        title: { text: '[ModPost] Channel Locked!', emoji: '🟠' },
        description: (this.DEV ? "DEV: " : "") + mentionFuncs.channelMention(channel.id) + ` has been ${bold('locked')}.`,
      }
      let modPost = await new RookMessage(
        client,
        interaction,
        {
          channelName: channel.id,
          pages: [ embedProps ]
        }
      )
      await modPost.execute()
      this.messages.push(`/${this.name}: ModPost`)

      // Log the action in the logs channel (private)
      const logs = await this.getChannel(client, interaction, [ "logging-lock", "logging" ])
      if (logs && !this.DEV) {
        let props = {
          color: this.profile.colors.bad,
          title: { text: "[Log] Channel Locked", emoji: this.profile.emojis.lock },
          fields: [
            [
              { name: 'Channel Locked', value: [mentionFuncs.channelMention(channel.id, { showID: true })] },
              { name: 'Locked By',      value: [mentionFuncs.userMention(interaction.user.id, { showID: true })] }
            ]
          ]
        }
        let logPost = await new RookMessage(
          client,
          interaction,
          {
            channelName: logs.id,
            pages: [ props ]
          }
        )
        await logPost.execute()
        this.messages.push(`/${this.name}: LogPost`)
      } else {
        this.messages.push("Logs channel not found.")
      }

      // Complete the interaction with a private success message
      this.props.description = (this.DEV ? "DEV: " : "") + mentionFuncs.channelMention(channel.id) + ` has been successfully ${bold('locked')}!`
    } catch (error) {
      this.messages.push(`There was an error when locking the channel: ${error.stack}`)
      this.error = true
      this.ephemeral = true
      this.props.description = `I couldn't lock ${mentionFuncs.channelMention(channel.id)}.`
      return !this.error
    }

    return true
  }
}
