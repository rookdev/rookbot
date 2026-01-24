// @ts-nocheck

const { Client } = require('discord.js')              // Get Discord Client
const getProfile = require('../../utils/client/getProfile')  // Get loaded Profile
const fileFuncs = require('../../utils/fs/fileFuncs')
const getters = require('../../utils/guild/getters')

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
    this.profile.colors = fileFuncs.getAFile(["src","dbs"], "colors.json")
    // Global Emojis
    this.profile.emojis = fileFuncs.getAFile(["src","dbs"], "emojis.json")
    // Delete Commands?
    this.profile.deleteCommands = options?.deleteCommands
    // Purge Commands?
    this.profile.purgeCommands = options?.purgeCommands

    for (let [optName, optVal] of Object.entries(options)) {
      this.profile[optName] = optVal
    }
  }

  async init() {
    // Set the Guild
    this.guild = await getters.getCache(this, this, "guilds", this.guildID)
  }
}

exports.RookClient = RookClient
