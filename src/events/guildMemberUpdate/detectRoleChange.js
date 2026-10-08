const { GuildMember, hyperlink } = require('discord.js')
const { EventScript } = require('../../classes/event/eventscript.class')
const { RookMessage } = require('../../classes/objects/rmessage.class')
const { RookClient } = require('../../classes/objects/rclient.class')
const timeConversion = require('../../utils/formatters/timeConversion')
const mentionFuncs = require('../../utils/formatters/mentions')
const dbFuncs = require('../../utils/db/dbFuncs')
const moment = require('moment')

/**
 * @class
 * @this {RoleChangeEvent}
 * @public
 */
module.exports = class RoleChangeEvent extends EventScript {
  constructor(client) {
    let evtprops = {
      name: "roleChange",
      event: "guildMemberUpdate",
      label: "Detect Role Change and do something",
      description: "Log to a channel when a member has specific roles added/removed"
    }
    super(
      client,
      {...evtprops}
    )
  }

  /**
   * @param {RookClient} client
   * @param {GuildMember} oldMember
   * @param {GuildMember} newMember
   */
  async action(client, oldMember, newMember) {
    // Get Guild
    let guild = await this.getGuild(client, newMember)

    // Get Role Logging data
    let logRolesRes = await dbFuncs.getDB(
      guild.id,
      "roleLogging"
    )
    let logRoles = logRolesRes[0]

    if (!logRoles) {
      return false
    }

    // Check to see that roles have changed
    let oldRoles = await oldMember.roles.valueOf().sort((roleA,roleB)=>roleB.position-roleA.position).map(role=>role.name).filter(roleName=>roleName!="@everyone").join(", ")
    let newRoles = await newMember.roles.valueOf().sort((roleA,roleB)=>roleB.position-roleA.position).map(role=>role.name).filter(roleName=>roleName!="@everyone").join(", ")
    if (oldRoles == newRoles) {
      return false
    }

    // Make bucket for role data
    let roleSets = { db: {}, addedNames: [], removedNames: [] }

    // Get old roles & new roles
    for (let [roleSet, roleMember] of Object.entries(
      {
        old: oldMember,
        new: newMember
      }
    )) {
      roleSets[roleSet] = await roleMember
        .roles
        .valueOf()
        .sort(
          (roleA, roleB) => roleB.position - roleA.position
        )
      roleSets[roleSet] = Object.fromEntries(roleSets[roleSet])
      let newRoleSet = []
      for (let [roleID, role] of Object.entries(roleSets[roleSet])) {
        if (role.name == "@everyone") {
          delete roleSets[roleSet][roleID]
        } else {
          newRoleSet.push(roleID)
          if (!roleSets["db"][roleID]) {
            roleSets["db"][roleID] = {
              name:     role.name,
              id:       role.id,
              position: role.position
            }
          }
        }
      }
      roleSets[roleSet] = newRoleSet
    }
    // Get Venn Diagrams of roles
    roleSets.both     = roleSets.old.filter(x =>  roleSets.new.includes(x))
    roleSets.removed  = roleSets.old.filter(x => !roleSets.new.includes(x))
    roleSets.added    = roleSets.new.filter(x => !roleSets.old.includes(x))
    for (let roleID of roleSets.removed) {
      roleSets.removedNames.push(roleSets.db[roleID].name)
    }
    for (let roleID of roleSets.added) {
      roleSets.addedNames.push(roleSets.db[roleID].name)
    }

    let doLog = false
    for (let roleSet of ["added","removed"]) {
      if (doLog) {
        break
      }
      for (let roleName of roleSets[`${roleSet}Names`]) {
        if (doLog) {
          break
        }
        if (logRoles.includes(roleName)) {
          doLog = true
        }
      }
    }

    if (!doLog) {
      return false
    }

    // Make logpost
    let logProps = {}
    logProps.title = {
      text: "[Log] Roles Changed",
      emoji: "🏷️"
    }
    if ((roleSets.removed.length > 0) && (roleSets.added.length > 0)) {
      logProps.color = client.profile.colors.info
    } else if (roleSets.added.length > 0) {
      logProps.color = client.profile.colors.good
      logProps.title = {
        text: "[Log] Roles Added",
        emoji: "➕"
      }
    } else if (roleSets.removed.length > 0) {
      logProps.color = client.profile.colors.bad
      logProps.title = {
        text: "[Log] Roles Removed",
        emoji: "➖"
      }
    }
    logProps.entities = {
      guild: {
        name: guild.name,
        avatar: await guild.iconURL({ size: 128 })
      },
      target: {
        name: newMember.user.displayName,
        avatar: await newMember.user.displayAvatarURL({ size: 128 })
      }
    }
    logProps.playerTypes = {
      user: "guild",
      target: "target"
    }
    logProps.description = []
    for (let roleSet of ["added","removed"]) {
      if (roleSets[roleSet].length > 0) {
        logProps.description.push(`**${roleSet.ucfirst()}**`)
        for (let roleID of roleSets[roleSet]) {
          logProps.description.push(mentionFuncs.roleMention(roleID))
        }
      }
    }
    logProps.fields = []
    let field = {}
    let fieldRow = []

    let logType = "roles"
    // [Elapsed Time]
    let guildRolesRes = await dbFuncs.getDB(
      guild.id,
      "roles"
    )
    let guildRoles = guildRolesRes[0]
    if (guildRoles) {
      if (guildRoles["member"]) {
        let verifiedRole = false
        for (let roleSet of ["added","removed"]) {
          if (verifiedRole) {
            break
          }
          for (let roleName of roleSets[`${roleSet}Names`]) {
            if (verifiedRole) {
              break
            }
            if (guildRoles["member"].includes(roleName)) {
              verifiedRole = true
              if (roleSet == "added") {
                logProps.title = {
                  text: "[Log] Member Verified",
                  emoji: client.profile.emojis.success
                }
              } else if (roleSet == "removed") {
                logProps.title = {
                  text: "[Log] Member Denied",
                  emoji: client.profile.emojis.bad
                }
              }
            }
          }
        }
        if (verifiedRole) {
          logType = "members"
          let verifiedDateTime = moment.utc()
          let joinedDateTime = moment.utc(newMember.joinedTimestamp)
          let durationStr = timeConversion(
            moment.duration(
              Math.abs(
                joinedDateTime.diff(
                  verifiedDateTime
                )
              )
            )
          )
          field = {
            name: "Elapsed Time",
            value: durationStr
          }
          fieldRow.push(field)
          logProps.fields.push(fieldRow)
          fieldRow = []
        }
      }
    }

    // [Logged Member]
    field = {
      name: "Logged Member",
      value: hyperlink(
        newMember.user.tag,
        `https://discord.com/users/${newMember.user.id}`
      )
    }
    fieldRow.push(field)
    logProps.fields.push(fieldRow)
    fieldRow = []

    // [Member Mention]
    field = {
      name: "Member Mention",
      value: mentionFuncs.userMention(
        newMember.user.id,
        { showID: true }
      )
    }
    fieldRow.push(field)
    logProps.fields.push(fieldRow)
    fieldRow = []

    // [Guild]
    field = {
      name: "Guild",
      value: mentionFuncs.guildMention(
        guild.name,
        guild.id,
        { showID: true }
      )
    }
    fieldRow.push(field)
    logProps.fields.push(fieldRow)
    fieldRow = []

    // [Message]

    await this.logPost(
      client,
      guild,
      logType,
      logProps
    )
  }
}
