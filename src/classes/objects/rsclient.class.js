const { client, Events } = require('stoatbot.js')
const getProfile = require('../../utils/client/getProfile')  // Get loaded Profile
const fileFuncs = require('../../utils/fs/fileFuncs')

/**
 * @class
 * @classdesc Create a Rook-branded Stoat Client
 * @this {RookSClient}
 * @public
 */
class RookSClient extends client {
  constructor(
    args={},
    profileName="default",
    options={}
  ) {
    super()

    // Platform
    this.platform     = "stoat"
    // Client Events
    this.eventNames   = Object.values(Events)
    // Commands
    this.commands     = {}
    // Guild Object
    this.guild        = null
    // Guild ID
    this.guildID      = process.env?.GUILD_ID ?? "01KHHXDY8KQ3XAMX3BS6SPKFZB"
    // Loaded Profile Name
    this.profileName  = profileName
    // Loaded Profile
    this.profile      = getProfile(this.profileName)
    // Global Colors
    this.profile.colors = fileFuncs.getAFile(["src","dbs"], "colors.json")
    // Global Emojis
    this.profile.emojis = fileFuncs.getAFile(["src","dbs"], "emojis.json")
  }
}

exports.RookSClient = RookSClient
