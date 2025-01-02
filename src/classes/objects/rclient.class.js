// @ts-nocheck

const { Client } = require('discord.js')              // Get Discord Client
const getProfile = require('../../utils/getProfile')  // Get loaded Profile

/**
 * @class
 * @classdesc Create a Rook-branded Client
 * @this {RookClient}
 * @public
 */
class RookClient extends Client {
  constructor(
    args={},
    profileName="default",
    options={}
  ) {
    super(args) // Create Discord Client object

    // Commands
    this.commands     = {}
    // Guild Object
    this.guild        = null
    // Guild ID
    this.guildID      = process.env?.GUILD_ID ?? "1303864272832565268"
    // Loaded Profile Name
    this.profileName  = profileName
    // Loaded Profile
    this.profile      = getProfile(this.profileName)
    // Global Colors
    this.profile.colors = require("../../dbs/colors.json")
    // Global Emojis
    this.profile.emojis = require("../../dbs/emojis.json")

    for (let [optName, optVal] of Object.entries(options)) {
      this.profile[optName] = optVal
    }
  }

  async init() {
    // Set the Guild
    this.guild = await this.guilds.cache.get(this.guildID)
  }
}

exports.RookClient = RookClient
