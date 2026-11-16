// @ts-nocheck

const { GuildMember, hyperlink } = require('discord.js')
const { EventScript } = require('../../classes/event/eventscript.class')
const { RookClient } = require('../../classes/objects/rclient.class')
const mentionFuncs = require('../../utils/formatters/mentions')
const timeFormat = require('../../utils/formatters/timeFormat')
const dbFuncs = require('../../utils/db/dbFuncs')
const moment = require('moment')

/**
 * @class
 * @this {AutoRoleEvent}
 * @public
 */
module.exports = class AutoRoleEvent extends EventScript {
  constructor(client) {
    let evtprops = {
      name: "autorole",
      event: "guildMemberAdd",
      label: "Member AutoRole",
      description: "Automatically add a role when a member joins"
    }
    super(
      client,
      {...evtprops}
    )
  }

  /**
   * 
   * @param {RookClient} client 
   * @param {GuildMember} newMember 
   * @returns 
   */
  async action(client, newMember) {
    // this.messages.push(`/${this.name}: Event Action`)
    let guild = await this.getGuild(client, newMember)

    let dbRes = await dbFuncs.getDB(
      guild.id,
      "autoroles"
    )
    let autoRoles = dbRes[0]
    this.messages.push(...dbRes[1])

    if (autoRoles) {
      for (let autoRoleName of autoRoles) {
        let autoRole = await this.getCache(client, guild, "roles", autoRoleName)
        await newMember.roles.add(autoRole)
      }
    }

    // appended messages for debugging
    await this.logMessages(
      "📇",
      {
        guild: guild.name,
        member: newMember.user.tag,
        action: "autoroles"
      }
    )
  }
}
