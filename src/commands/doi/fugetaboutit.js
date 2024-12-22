const { Client, Interaction } = require('discord.js');
const { RookEmbed } = require('../../classes/embed/rembed.class');
const path = require('path');

// FIXME: Update to OOP

module.exports = {
  /**
   *
   * @param {RookClient} client
   * @param {Interaction} interaction
   */
  execute: async (client, interaction) => {
    // Path to the local video file
    const videoPath = path.join(__dirname, '..', '..', 'res', 'media', 'fugetaboutit.mp4');

    try {

      // Send the video to the channel the command was sent in
      await interaction.reply({
        files: [videoPath],
      });
    } catch (error) {
      let props = {
        color: "#FF0000",
        title: {
          text: "Error"
        },
        description: "There as an error uploading the video."
      }
      const embed = new RookEmbed(client, props)
      console.log(`There was an error when uploading the video: ${error.stack}`);
      // If error occurs, use an ephemeral reply to privately inform the user
      await interaction.followUp({ embeds: [ embed ], ephemeral: true });
    }
  },

  name: 'fugetaboutit',
  description: 'Pronunciation tutorial',
}
