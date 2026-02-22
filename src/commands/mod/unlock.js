// @ts-nocheck

/**
 * Discord Stuff
 *  Command Option Type
 *  Permission Flags
 *  Formatters
 *   bold
 */
// Command Option Types, Permission Flags
const {
  ApplicationCommandOptionType,
  PermissionFlagsBits,
  bold
} = require('discord.js')
const { RookMessage } = require('../../classes/objects/rmessage.class')
// ModCommand
const { ModCommand } = require('../../classes/command/modcommand.class')
// Base Rook Embed
const { RookEmbed } = require('../../classes/embed/rembed.class')
const mentionFuncs = require('../../utils/formatters/mentions')

// Multiple messages

module.exports = class UnlockCommand extends ModCommand {
  constructor(client) {
    let comprops = {
      name: "unlock",
      category: "mod",
      description: "Unlocks a channel, allowing users to send messages again.",
      options: [
        {
          name: "channel",
          description: "The channel to unlock.",
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
    // Get requested Channel
    const channel = await this.getCache(client, client, "channels", channelID)

    try {
      if (!this.DEV) {
        // Unlock the channel by allowing SEND_MESSAGES for @everyone
        await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
          SendMessages: null, // Removes the overwrite
        })
      }

      // Send public confirmation in the channel
      const embedProps = {
        color: this.profile.colors.success,
        title: { text: '[ModPost] Channel Unlocked!', emoji: this.profile.emojis.success },
        description: (this.DEV ? "DEV: " : "") + mentionFuncs.channelMention(channel.id) + ` has been ${bold('unlocked')}.`,
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
      const logs = await this.getChannel(client, interaction, [ "logging-unlock", "logging" ])
      if (logs && !this.DEV) {
        let props = {
          color: this.profile.colors.success,
          title: { text: "[Log] Channel Unlocked", emoji: this.profile.emojis.unlock },
          fields: [
            [
              { name: 'Channel Unlocked', value: [mentionFuncs.channelMention(channel.id, { showID: true })] },
              { name: 'Unlocked By',      value: [mentionFuncs.userMention(interaction.user.id, { showID: true })] }
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
      this.props.description = (this.DEV ? "DEV: " : "") + mentionFuncs.channelMention(channel.id) + ` has been successfully ${bold('unlocked')}!`
    } catch (error) {
      this.messages.push(`There was an error when unlocking the channel: ${error.stack}`)
      this.error = true
      this.ephemeral = true
      this.props.description = `I couldn't unlock ${mentionFuncs.channelMention(channel.id)}.`
    }

    return true
  }
}
