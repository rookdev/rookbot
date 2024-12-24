// @ts-nocheck

const { ChatInputCommandInteraction } = require('discord.js')
const { RookCommand } = require('../../classes/command/rcommand.class.js')
const { RookClient } = require('../../classes/objects/rclient.class.js')

module.exports = class JustinCommand extends RookCommand {
  constructor(client) {
    let comprops = {
      name: "justin",
      category: "doi",
      description: "Displays an embed showcasing the developer's video games from their portfolio.",
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

  async action(client, interaction, coptions={}) {
    this.props = {
      title: {
        text: "Developer Portfolio: Justin Bohemier",
        url: "https://justinbohemier.wixsite.com/portfolio/game-design"
      },
      image: { image: "https://static.wixstatic.com/media/1e0275_aa58ad283e7e428a995f2b2aeda902e5~mv2.jpg/v1/fill/w_887,h_492,al_c,q_85,usm_0.66_1.00_0.01,enc_auto/1e0275_aa58ad283e7e428a995f2b2aeda902e5~mv2.jpg" },
      description: "Explore the exciting video games created by Justin Bohemier!",
      fields: [
        [
          {
            name: 'Game Design Showcase',
            value: `Justin Bohemier's portfolio features innovative and engaging video games. Explore the games he has worked on and their development journey.`,
            inline: false,
          }
        ],
        [
          {
            name: 'Featured Projects',
            value: 'Check out some of the featured games and their unique mechanics, art styles, and storylines.',
            inline: false,
          }
        ],
        [
          {
            name: 'Learn More',
            value: 'Visit the [portfolio website](https://justinbohemier.wixsite.com/portfolio/game-design) to discover more about the games and the developer\'s journey.',
            inline: false,
          }
        ]
      ],
      footer: {
        text: "Visit Justin Bohemier's Portfolio for more!"
      }
    }

    return !this.error
  }
}
