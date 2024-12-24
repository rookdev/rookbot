// @ts-nocheck

const { RookCommand } = require('../../classes/command/rcommand.class')
const { serverGameName_base64encoded } = require('../../../config.json')

module.exports = class DOIGameCommand extends RookCommand {
  constructor(client) {
    // Decode the base64 string
    const serverGameName = Buffer.from(serverGameName_base64encoded, 'base64').toString('utf-8')
    let comprops = {
      name: "doigame",
      category: "doi",
      description: `Sends a message with download info for *${serverGameName}*.`,
      flags: {
        test: "basic"
      }
    }
    let props = {}

    super(
      client,
      {...comprops},
      {...props}
    )
  }

  // declare props: import('../../types/embed').EmbedProps

  async action(client, interaction, coptions={}) {
    // Decode the base64 string
    const serverGameName = Buffer.from(serverGameName_base64encoded, 'base64').toString('utf-8')

    const guildID = interaction.guild.id
    const guildMeta = require(`../../dbs/${guildID}/meta.json`)

    try {
      // Create an embed message
      this.props = {
        title: {
          text: `Download ${serverGameName}`,
          url: guildMeta["downloads"]
        },
        description: `You can download ${serverGameName} below!`,
        fields: [
          [
            { name: 'Download Link', value: `[__Click here to download the Latest Game Version__](${guildMeta['downloads']})`, inline: false }
          ],
          [
            { name: 'Need Help?', value: `For more detailed setup instructions, please refer to [our Support Thread](${guildMeta['supportpost']}).`, inline: false }
          ]
        ]
      }
    } catch (error) {
      this.error = true
      this.props.description = "There was an error posting the download information."
    }

    return !this.error
  }
}
