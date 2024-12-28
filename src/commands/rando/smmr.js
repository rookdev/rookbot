// @ts-nocheck

const { ApplicationCommandOptionType } = require('discord.js')
const SeedAnnounceCommand = require('../rando/seedannounce')

/**
 * @class
 * @classdesc Super Metroid Map Randomizer Seed Announcer
 * @this {SMMRSeedCommand}
 * @extends {SeedAnnounceCommand}
 * @public
 */
module.exports = class SMMRSeedCommand extends SeedAnnounceCommand {
  constructor(client) {
    let comprops = {
      name: "smmr",
      description: "Super Metroid Map Randomizer Seed Announcer",
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
      ]
    }
    super(
      client,
      {...comprops},
      {}
    )
  }

  async execute(client, interaction, coptions={}, independent=false) {
    let options = {
      randomizer: "m3maprando",
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
