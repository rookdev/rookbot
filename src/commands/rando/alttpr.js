const { ApplicationCommandOptionType } = require('discord.js')
const SeedAnnounceCommand = require('../rando/seedannounce')

/**
 * @class
 * @classdesc Super Metroid Map Randomizer Seed Announcer
 * @this {ALttPRSeedCommand}
 * @extends {SeedAnnounceCommand}
 * @public
 */
module.exports = class ALttPRSeedCommand extends SeedAnnounceCommand {
  constructor(client) {
    let comprops = {
      name: "alttpr",
      description: "A Link to the Past Randomizer Seed Announcer",
      category: "rando",
      options: [
        {
          name: "ping-multiplayer-role",
          description: "Whether or not to ping the Multiplayer Ping role",
          type: ApplicationCommandOptionType.Boolean
        },
        {
          name: 'seed-url',
          description: 'The URL of the seed to play',
          type: ApplicationCommandOptionType.String
        },
        {
          name: 'prep-time',
          description: 'The number of minutes to prepare before the game starts.',
          type: ApplicationCommandOptionType.Integer
        }
      ]
    }
    super(
      client,
      {...comprops},
      {}
    )
  }

  async execute(client, interaction, coptions={}, independent=false) {
    coptions = interaction.options
    let options = {
      randomizer: "alttpr",
      "ping-multiplayer-role": coptions["ping-multiplayer-role"] ?? false,
      "seed-url": coptions["seed-url"] ?? "",
      "prep-time": coptions["prep-time"] ?? 0
    }
    await super.execute(
      client,
      interaction,
      options
    )
  }
}
