// @ts-nocheck

// Command Option Types, Permission Flags, Formatters: bold, inlineCode
const { ApplicationCommandOptionType, PermissionFlagsBits, bold, inlineCode } = require('discord.js')
// ModCommand
const { ModCommand } = require('../../classes/command/modcommand.class')
// Base Rook Embed
const { RookEmbed } = require('../../classes/embed/rembed.class')

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
        description: (this.DEV ? "DEV: " : "") + `<#${channel.id}> has been ${bold('locked')}.`,
      }
      const embed = new RookEmbed(client, embedProps)
      channel.send({ embeds: [ embed ] })
      console.log(`/${this.name}: ModPost`)

      // Log the action in the logs channel (private)
      const logs = await this.getChannel(client, interaction, [ "logging-lock", "logging" ])
      if (logs && !this.DEV) {
        let props = {
          color: this.profile.colors.bad,
          title: { text: "[Log] Channel Locked", emoji: this.profile.emojis.lock },
          fields: [
            [
              { name: 'Channel Locked', value: [`<#${channel.id}>`,`[${inlineCode(channel.id)}]`] },
              { name: 'Locked By',      value: [`${interaction.user}`,`[${inlineCode(interaction.user.id)}]`] }
            ]
          ]
        }
        const embed = new RookEmbed(client, props)
        logs.send({ embeds: [ embed ] })
        console.log(`/${this.name}: LogPost`)
      } else {
        console.log("Logs channel not found.")
      }

      // Complete the interaction with a private success message
      this.props.description = (this.DEV ? "DEV: " : "") + `<#${channel.id}> has been successfully ${bold('locked')}!`
    } catch (error) {
      console.log(`There was an error when locking the channel: ${error.stack}`)
      this.error = true
      this.ephemeral = true
      this.props.description = `I couldn't lock <#${channel.id}>.`
      return !this.error
    }

    return true
  }
}
