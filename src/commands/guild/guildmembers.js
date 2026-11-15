// @ts-nocheck

// Formatters: codeBlock, inlineCode, bold, userMention
const { ChannelType, codeBlock, inlineCode, bold, userMention, roleMention } = require('discord.js')
// Base Rook Command
const { RookCommand } = require('../../classes/command/rcommand.class')
const mentionFuncs = require('../../utils/formatters/mentions')
const globalFuncs = require('../../utils/primitives/globalFuncs')
const dbFuncs = require('../../utils/db/dbFuncs')

module.exports = class GuildMembersCommand extends RookCommand {
  constructor(client) {
    let comprops = {
      name: "guildmembers",
      category: "guild",
      description: "Guild Members",
      flags: {
        test: "basic"
      },
      platforms: ["discord"]
    }
    let props = {
      title: {
        text: "Guild Members"
      }
    }
    super(
      client,
      {...comprops},
      {...props}
    )
  }

  // declare props: import('../../types/embed').EmbedProps

  async action(client, interaction, coptions={}) {
    let interactionGuild = await this.getGuild(client, interaction)
    if (!interactionGuild) {
      this.error = true
      this.props.description = "Command must be run in guild."
      return false
    }

    // Set EmbedPlayerTypes to Bot|Guild
    this.props.playerTypes = {
      user: "bot",
      target: "guild"
    }

    let counts = {
      total:          interactionGuild.memberCount, // Total connected accounts
      people:         0,                            // !user.bot
      bots:           0,                            // user.bot
      members:        0,                            // @Member
      peopleMembers:  0,                            // @Member && !user.bot
      botMembers:     0                             // @Member && user.bot
    }

    let guildMembers = await interactionGuild.members.fetch()
    counts.people = guildMembers.filter(m => !m.user.bot).size
    counts.bots   = guildMembers.filter(m => m.user.bot).size

    let newCounts = {
      total:  interactionGuild.memberCount,               // Total connected accounts
      people: guildMembers.filter(m => !m.user.bot).size, // !user.bot
      bots:   guildMembers.filter(m => m.user.bot).size   // user.bot
    }

    let dbRes = await dbFuncs.getDB(
      interactionGuild.id,
      "roles"
    )
    let guildRoles = dbRes[0]
    this.messages.push(...dbRes[1])

    this.props.description = []
    this.props.description.push(
      inlineCode((counts.people+"").padStart(4)  + ":") + "👤",
      inlineCode((counts.bots+"").padStart(4)    + ":") + "🤖"
    )

    for (let roleType of [
        "access",
        "member",
        "server-tag"
      ]
    ) {
      if (roleType in guildRoles) {
        newCounts[roleType] = {}
        let members = await guildMembers.filter(
          (m) => {
            // Get a Guild Member
            let guildMember = m
            // Get this Guild Member's Roles
            let mRoles = guildMember.roles
            // Convert Roles to Names
            let mRolesNames = mRoles
              .valueOf()
              // Sort by Rank
              // .sort((roleA, roleB) => roleB.position - roleA.position)
              // Get Names
              .map(r => r.name)
              // Remove @everyone
              .filter(rName => rName != "@everyone")

            // Get DB-defined Member Roles
            let memberRoles = guildRoles[roleType]
            // See if there's an intersection
            let venn = mRolesNames.filter(v => memberRoles.includes(v))
            let isMember = !globalFuncs.empty(venn)
            return isMember
          }
        )
        newCounts[roleType].people  = members.filter(m => !m.user.bot).size
        newCounts[roleType].bots    = members.filter(m =>  m.user.bot).size
        newCounts[roleType].members = members.size
      }
    }

    if ("member" in guildRoles) {
      let members = await guildMembers.filter(
        (m) => {
          // Get a Guild Member
          let guildMember = m
          // Get this Guild Member's Roles
          let mRoles = guildMember.roles
          // Convert Roles to Names
          let mRolesNames = mRoles
            .valueOf()
            // Sort by Rank
            // .sort((roleA, roleB) => roleB.position - roleA.position)
            // Get Names
            .map(r => r.name)
            // Remove @everyone
            .filter(rName => rName != "@everyone")

          // Get DB-defined Member Roles
          let memberRoles = guildRoles["member"]
          // See if there's an intersection
          let venn = mRolesNames.filter(v => memberRoles.includes(v))
          let isMember = !globalFuncs.empty(venn)
          return isMember
        }
      )

      counts.peopleMembers  = members.filter(m => !m.user.bot).size
      counts.botMembers     = members.filter(m =>  m.user.bot).size
      counts.members        = members.size

      // counts = newCounts

      for (let [roleType, rData] of Object.entries(newCounts)) {
        if (["total","people","bots"].includes(roleType)) { continue }
        let role = await this.getCache(client, interactionGuild, "roles", guildRoles[roleType][0])
        for (let [mType, mCount] of Object.entries(rData)) {
          let mIcon = "👤"
          switch(mType) {
            case "bots":
              mIcon = "🤖"
              break
            case "members":
              mIcon = "🌎"
              break
          }
          this.props.description.push(
            inlineCode((mCount+"").padStart(4) + ":") + mIcon + inlineCode("_") + mentionFuncs.roleMention(role.id)
          )
          if (mType == "people") {
            this.props.description.push(
              inlineCode(((newCounts.people-mCount)+"").padStart(4) + ":") + mIcon + inlineCode("!") + mentionFuncs.roleMention(role.id)
            )
          }
        }
      }
    }
    this.props.description.push(
      inlineCode((counts.total+"").padStart(4)   + ":") + "🌎"
    )

    this.messages.push(
      JSON.stringify(newCounts)
    )

    return !this.error
  }
}
