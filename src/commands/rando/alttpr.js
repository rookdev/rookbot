// @ts-nocheck

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
          name: "pingable-role-id",
          description: "Role ID number to ping",
          type: ApplicationCommandOptionType.String
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
      ],
      testOptions: [
        {},
        { "ping-multiplayer-role": true },
        { "seed-url": "https://alttpr.com/h/0yAONb6XMV" },
        { "prep-time": 60 }
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
      randomizer: "z3r",
      "ping-multiplayer-role": (await interaction.options.get("ping-multiplayer-role")?.value) ?? false,
      "pingable-role-id": (await interaction.options.get("pingable-role-id")?.value) ?? 0,
      "seed-url": (await interaction.options.get("seed-url")?.value) ?? "",
      "prep-time": (await interaction.options.get("prep-time")?.value) ?? 0
    }
    return await super.execute(
      client,
      interaction,
      options
    )
  }
}
