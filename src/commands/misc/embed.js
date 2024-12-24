// @ts-nocheck

const { AdminCommand } = require('../../classes/command/admincommand.class')

module.exports = class EmbedCommand extends AdminCommand {
  constructor(client) {
    let comprops = {
      name: "embed",
      category: "misc",
      description: "Sends an embed with predefined content",
      flags: {
        test: "basic"
      }
    }
    let props = {
      title: {
        text: "Embed Title",
        url: "https://justinbohemier.wixsite.com/portfolio/game-design"
      },
      description: "This is an embed description",
      color: "Random",
      fields: [
        [
          {
            name: "Field title",
            value: "Some random value",
            inline: true
          }
        ],
        [
          {
            name: "2nd Field title",
            value: "Some random value",
            inline: true
          }
        ],
        [
          {
            name: "3rd Field title",
            value: "Some random value",
            inline: true
          }
        ]
      ],
      image: { image: "https://pbs.twimg.com/media/GcPyiUlasAEEtPJ?format=jpg&name=900x900" },
      footer: {
        text: "Footer text",
        image: "https://pbs.twimg.com/media/GcPyiUlasAEEtPJ?format=jpg&name=900x900"
      }
    }

    super(
      client,
      {...comprops},
      {...props}
    )
  }

  /**
   * Sends an embed message in response to a slash command interaction.
   */
  async action(client, interaction, coptions={}) {
    // all done in constructor
    return !this.error
  }
}
