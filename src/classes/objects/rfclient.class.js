const { Client } = require('discord.js')
const getProfile = require('../../utils/client/getProfile')  // Get loaded Profile
const fileFuncs = require('../../utils/fs/fileFuncs')
const getters = require('../../utils/guild/getters')

/**
 * @class
 * @classdesc Create a Rook-branded Fluxer Client
 * @this {RookFClient}
 * @public
 */
class RookFClient extends Client {
  constructor(
    args={},
    profileName="default",
    options={}
  ) {
    super(args)

    // Platform
    this.platform     = "fluxer"
    // Commands
    this.commands     = {}
    // Guild Object
    this.guild        = null
    // Guild ID
    // this.guildID      = process.env?.GUILD_ID ?? "Flux:1476765618626433235"
    this.guildID      = "Flux:1476765618626433235"
    // Loaded Profile Name
    this.profileName  = profileName
    // Loaded Profile
    this.profile      = getProfile(this.profileName)
    // Global Colors
    this.profile.colors = fileFuncs.getAFile(["src","dbs"], "colors.json")
    // Global Emojis
    this.profile.emojis = fileFuncs.getAFile(["src","dbs"], "emojis.json")

    for (let [optName, optVal] of Object.entries(options)) {
      this.profile[optName] = optVal
    }
  }

  async init() {
    // Set the Guild
    this.guild = await getters.getCache(this, this, "guilds", this.guildID)
  }
}

exports.RookFClient = RookFClient
