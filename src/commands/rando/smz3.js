// @ts-check

// Command Option Types
const { ApplicationCommandOptionType } = require('discord.js')
// SeedAnnounceCommand
const SeedAnnounceCommand = require('../rando/seedannounce')

/**
 * @class
 * @classdesc SMALttPR Seed Announcer
 * @this {SMZ3SeedCommand}
 * @extends {SeedAnnounceCommand}
 * @public
 */
module.exports = class SMZ3SeedCommand extends SeedAnnounceCommand {
  constructor(client) {
    let comprops = {
      name: "smz3",
      description: "SMZ3 Seed Announcer",
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
        { "seed-url": "https://samus.link/seed/q8q8Z5NMQlGiSYgqPHKTkA" },
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
    // Load sent options
    coptions = interaction.options

    // Set options
    let options = {
      randomizer: "z3m3",
      "ping-multiplayer-role": (await coptions.get("ping-multiplayer-role")?.value) ?? false,
      "pingable-role-id": (await coptions.get("pingable-role-id")?.value) ?? 0,
      "seed-url": (await coptions.get("seed-url")?.value) ?? "",
      "prep-time": (await coptions.get("prep-time")?.value) ?? 0
    }

    // Send to SeedAnnounceCommand
    return await super.execute(
      client,
      interaction,
      options
    )
  }
}
