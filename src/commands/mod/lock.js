const { ApplicationCommandOptionType, PermissionFlagsBits } = require('discord.js');
const { ModCommand } = require('../../classes/command/modcommand.class')
const { RookEmbed } = require('../../classes/embed/rembed.class');
const colors = require('../../dbs/colors.json')

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
        },
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
  /**
   * Locks a specified channel, preventing the @everyone role from sending messages.
   * @param {RookClient} client
   * @param {Interaction} interaction
   */
  async action(client, interaction, options) {
    const guildID = interaction.guild.id
    const guildChannels = require(`../../dbs/${guildID}/channels.json`)
    const channelID = options['channel']
    const channel = client.channels.cache.get(channelID)

    try {
      if (!this.DEV) {
        // Lock the channel by denying SEND_MESSAGES for @everyone
        await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
          SendMessages: false,
        })
      }

      // Send public confirmation in the channel
      const embedProps = {
        color: colors["bad"],
        title: { text: '[ModPost] Channel Locked!', emoji: '🟠' },
        description: (this.DEV ? "DEV: " : "") + `<#${channel.id}> has been **locked**.`,
      }
      const embed = new RookEmbed(client, embedProps)
      channel.send({ embeds: [ embed ] })
      console.log(`/${this.name}: ModPost`)

      // Log the action in the logs channel (private)
      const logs = client.channels.cache.get(guildChannels["logging"])
      if (logs && !this.DEV) {
        let props = {
          color: colors["bad"],
          title: { text: "[Log] Channel Locked", emoji: "🔒" },
          fields: [
            [
              { name: 'Channel Locked', value: `<#${channel.id}>\n(ID: \`${channel.id}\`)` },
              { name: 'Locked By',      value: `${interaction.user}\n(ID: \`${interaction.user.id}\`)` }
            ]
          ]
        }
        const embed = new RookEmbed(client, props)
        logs.send({ embeds: [ embed ] });
        console.log(`/${this.name}: LogPost`)
      } else {
        console.log("Logs channel not found.")
      }

      // Complete the interaction with a private success message
      this.props.description = (this.DEV ? "DEV: " : "") + `<#${channel.id}> has been successfully **locked**!`
    } catch (error) {
      console.log(`There was an error when locking the channel: ${error.stack}`);
      this.error = true
      this.ephemeral = true
      this.props.description = `I couldn't lock <#${channel.id}>.`
    }
  }
}
