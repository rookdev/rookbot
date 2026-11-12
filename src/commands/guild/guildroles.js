// @ts-nocheck

// Formatters: codeBlock, inlineCode, bold, userMention
const { ApplicationCommandOptionType, ChannelType, codeBlock, inlineCode, bold, userMention, Application, ApplicationCommand, ApplicationCommandOptionBase } = require('discord.js')
// Base Rook Command
const { RookCommand } = require('../../classes/command/rcommand.class')
const mentionFuncs = require('../../utils/formatters/mentions')
const globalFuncs = require('../../utils/primitives/globalFuncs')

module.exports = class GuildRolesCommand extends RookCommand {
  constructor(client) {
    let comprops = {
      name: "guildroles",
      category: "guild",
      description: "Guild Roles",
      flags: {
        test: "basic"
      },
      options: [
        {
          name: "role-id",
          description: "Role ID",
          type: ApplicationCommandOptionType.Role
        },
        {
          name: "page",
          description: "Page",
          type: ApplicationCommandOptionType.Number
        }
      ],
      platforms: ["discord"]
    }
    let props = {
      title: {
        text: "Guild Roles"
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
    // Get Target Input
    let targetInput   = coptions["role-id"] ?? null
    // Get Target ID
    let targetId = targetInput?.replace(/[<#@&!>]/g, '')  // Remove <@>, <@!>, and >
    let page = coptions["page"] ?? null

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

    this.props.description = []

    let max = 35
    if (targetId) {
      let role = await this.getCache(client, interactionGuild, "roles", targetId)
      this.props.description.push(
        inlineCode((role.id + "").padStart(20)) + ' [' + (await role.members.size) + ']: ' +
        mentionFuncs.roleMention(role.id)
      )
      this.props.description.push("")

      if (role.members) {
        let membersById = await role
          .members
          .valueOf()
          .map(member => { return { name: member.displayName, id: member.id }})
  
        let membersByName = {}
        Object.keys(membersById).forEach(
          (el, i) => {
            membersByName[membersById[el].name] = membersById[el].id
          }
        )

        let memberNames = Object.keys(membersByName).sort()

        if (memberNames.length > max) {
          memberNames = memberNames.slice(0, max)
        }

        for (let memberName of memberNames) {
          let memberId = membersByName[memberName]
          this.props.description.push(
            inlineCode((memberId + "").padStart(20)) + ': ' +
            mentionFuncs.userMention(memberId)
          )
        }
      }
    } else {
      let roleIds = await interactionGuild
        .roles
        .valueOf()
        .sort(
          (roleA, roleB) => roleB.position - roleA.position
        )
        .filter(role => role.name != "@everyone")
        .map(role => role.id)
      if (page) {
        roleIds = roleIds.slice(max * (page - 1))
      }
      if (roleIds.length > max) {
        roleIds = roleIds.slice(0, max)
      }
      for (let roleId of roleIds) {
        let role = await this.getCache(client, interactionGuild, "roles", roleId)
        this.props.description.push(
          inlineCode((roleId + "").padStart(20)) + ' [' + (await role.members.size) + ']: ' +
          mentionFuncs.roleMention(roleId)
        )
      }
    }

    return !this.error
  }
}
