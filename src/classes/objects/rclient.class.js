const { Client } = require('discord.js')
const getProfile = require('../../utils/getProfile')

/**
 * @class
 * @classdesc Create a Rook-branded Client
 * @this {RookClient}
 * @public
 */
class RookClient extends Client {
  constructor(args={}, profileName="default") {
    super(args)

    this.commands     = {}
    this.guild        = null
    this.guildID      = process.env.GUILD_ID || "1303864272832565268"
    this.profileName  = profileName
    this.profile      = getProfile(this.profileName)
  }

  async init() {
    this.guild = await this.guilds.cache.find(
      g => g.id === this.guildID
    )
  }
}

exports.RookClient = RookClient
