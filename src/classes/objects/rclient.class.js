// @ts-nocheck

const { Client, Collection, Events } = require('discord.js')             // Get Discord Client
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

    this.platform     = "discord"
    // Client Events
    this.eventNames   = Object.values(Events)
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
    this.guild = await getters.getCachedGuild(this, this.guildID)

    // Invites
    this.invites = {
      normal: new Collection(),
      vanity: new Collection()
    }
    let guilds = await getters.getProp(this, this, "guilds")
    if (guilds) {
      let guildsCache = await guilds.cache
      for (let [guildId, guildData] of guildsCache) {
        let guild = await getters.getCachedGuild(this, guildId)
        // guild = await guild.fetch()
        // console.log(guild.id, guild.name)
        // Normal Invites
        let invitesCache = null
        invitesCache = await guild.invites.fetch()
        if (invitesCache) {
          let invites = {}
          for (let [inviteId, inviteData] of invitesCache) {
            let invite = {
              guildName:    guild.name,
              channelName:  inviteData.channel.name,
              code:         inviteId,
              maxUses:      inviteData.maxUses,
              uses:         inviteData.uses
            }
            invites[inviteId] = invite
          }
          this.invites.normal.set(guildId, invites)
  
          // Vanity Invite
          if (guild?.vanityURLCode) {
            let newVanity = {}
            newVanity[guild.vanityURLCode] = {
              code: guild.vanityURLCode,
              uses: guild.vanityURLUses
            }
            this.invites.vanity.set(guildId, newVanity)
          }
        }
      }
      console.log(this.invites)
    }
  }
}

exports.RookClient = RookClient
