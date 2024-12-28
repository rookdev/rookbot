const { Client } = require('discord.js')              // Get Discord Client
const getProfile = require('../../utils/getProfile')  // Get loaded Profile

/**
 * @class
 * @classdesc Create a Rook-branded Client
 * @this {RookClient}
 * @public
 */
class RookClient extends Client {
  constructor(args={}, profileName="default") {
    super(args) // Create Discord Client object

    // Commands
    this.commands     = {}
    // Guild Object
    this.guild        = null
    // Guild ID
    this.guildID      = process.env.GUILD_ID || "1303864272832565268"
    // Loaded Profile Name
    this.profileName  = profileName
    // Loaded Profile
    this.profile      = getProfile(this.profileName)
  }

  async init() {
    // Set the Guild
    this.guild = await this.guilds.cache.find(
      g => g.id === this.guildID
    )
  }
}

exports.RookClient = RookClient
