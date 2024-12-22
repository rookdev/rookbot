const { ApplicationCommandOptionType, PermissionFlagsBits } = require('discord.js');
const { RookEmbed } = require('../../classes/embed/rembed.class');

// FIXME: Update to OOP

module.exports = {
  /**
   *
   * @param {RookClient} client
   * @param {Interaction} interaction
   */
  execute: async (client, interaction) => {
    const targetChannel = interaction.options.getChannel('channel'); // Get the target channel
    const message = interaction.options.getString('message'); // Get the message content

    // Check if the bot has permissions to send messages in the target channel
    if (!targetChannel.permissionsFor(client.user).has(PermissionFlagsBits.SendMessages)) {
      let props = {
        color: "#FF0000",
        title: {
          text: "Error"
        },
        description: `I don't have permission to send messages in ${targetChannel}.`
      }
      const embed = new RookEmbed(client, props)
      await interaction.reply({
        embeds: [ embed ],
        ephemeral: true,
      });
      return;
    }

    try {
      // Send the message in the specified channel
      await targetChannel.send(message);

      // Acknowledge the command
      let props = {
        color: "#00FF00",
        title: {
          text: "Success!"
        },
        description: `Message successfully sent to ${targetChannel}.`
      }
      const embed = new RookEmbed(client, props)
      await interaction.reply({
        embeds: [ embed ],
        ephemeral: true,
      });
    } catch (error) {
      console.error(`Error sending message to ${targetChannel.name}:`, error);
      let props = {
        color: "#FF0000",
        title: {
          text: "Error"
        },
        description: `There was an error trying to send the message to ${targetChannel}.`
      }
      const embed = new RookEmbed(client, props)
      await interaction.reply({
        embeds: [ embed ],
        ephemeral: true,
      });
    }
  },

  name: 'say',
  description: 'Make the bot send a message in the specified channel.',
  options: [
    {
      name: 'channel',
      description: 'The channel to send the message in.',
      type: ApplicationCommandOptionType.Channel,
      required: true,
    },
    {
      name: 'message',
      description: 'The message to send.',
      type: ApplicationCommandOptionType.String,
      required: true,
    },
  ],
  permissionsRequired: [PermissionFlagsBits.ManageMessages], // Restrict to staff
  botPermissions: [PermissionFlagsBits.SendMessages], // Ensure bot can send messages
}
