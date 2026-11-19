// @ts-nocheck

// Formatters: codeBlock, inlineCode, bold, userMention
const { ApplicationCommandOptionType, ChannelType, codeBlock, inlineCode, bold, userMention, Application, ApplicationCommand, ApplicationCommandOptionBase } = require('discord.js')
// Base Rook Command
const { RookCommand } = require('../../classes/command/rcommand.class')
const mentionFuncs = require('../../utils/formatters/mentions')
const globalFuncs = require('../../utils/primitives/globalFuncs')

module.exports = class ServerRolesCommand extends RookCommand {
  constructor(client) {
    let comprops = {
      description: "Server Roles",
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
        },
        {
          name: "member-type",
          description: "Member Type",
          type: ApplicationCommandOptionType.String,
          choices: [
            {
              name: "People",
              value: "people"
            },
            {
              name: "Bots",
              value: "bots"
            },
            {
              name: "All",
              value: "members"
            }
          ]
        },
        {
          name: "logic-mode",
          description: "Logic Mode",
          type: ApplicationCommandOptionType.String,
          choices: [
            {
              name: "Yes",
              value: "yes"
            },
            {
              name: "Not",
              value: "not"
            }
          ]
        }
      ],
      playerTypes: {
        user:   "bot",
        target: "guild"
      },
      platforms: ["discord"]
    }
    let props = {
      title: {
        text: "Server Roles"
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
    let memberType = coptions["member-type"] ?? "members"
    let logicMode = coptions["logic-mode"] ?? "yes"

    let interactionGuild = await this.getGuild(client, interaction)
    if (!interactionGuild) {
      this.error = true
      this.props.description = "Command must be run in guild."
      return false
    }

    this.props.title.text = `Guild Roles for ${interactionGuild.name}`
    this.props.description = []
    this.props.description.push(bold("Guild"))
    this.props.description.push(mentionFuncs.guildMention(interactionGuild.name, interactionGuild.id, { showID: true }))
    this.props.description.push("")

    let max = 35
    if (targetId) {
      let role = await this.getCache(client, interactionGuild, "roles", targetId)

      if (role.members) {
        let membersById = await role
          .members
          .valueOf()
        if (logicMode == "not") {
          membersById = await interactionGuild.members.cache.filter(m => !m.roles.cache.has(role.id))
        }
        if (memberType == "people") {
          membersById = membersById.filter(m => !m.user.bot)
        } else if (memberType == "bots") {
          membersById = membersById.filter(m => m.user.bot)
        }
        membersById = membersById.map(member => { return { name: member.displayName, id: member.id }})

        let membersByName = {}
        Object.keys(membersById).forEach(
          (el, i) => {
            // membersByName[membersById[el].name] = membersById[el].id
            membersByName[membersById[el].name.toLowerCase()] = membersById[el].id
          }
        )

        let memberNames = Object.keys(membersByName).sort()

        this.props.description.push(
          inlineCode((role.id + "").padStart(20)) + ' [' + (memberNames.length) + '/' + (await role.members.size) + ']: ' +
          (
            {
              "people":   client.profile.emojis.user,
              "bots":     client.profile.emojis.bot,
              "members":  client.profile.emojis.global
            }[memberType]
          ) +
          (logicMode == "not" ? "Not " : "") +
          mentionFuncs.roleMention(role.id)
        )
        this.props.description.push("")

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
      let start = 1
      let end   = roleIds.length
      let last  = end
      if (page) {
        roleIds = roleIds.slice(max * (page - 1))
        end     = roleIds.length

        if (page > 1) {
          start = start + (max * (page - 1))
          end   = end   + (max * (page - 1))
        }
      }
      if (roleIds.length > max) {
        roleIds = roleIds.slice(0, max)
        end     = roleIds.length

        if (page > 1) {
          end = end + (max * (page - 1))
        }
      }

      for (let roleId of roleIds) {
        let role = await this.getCache(client, interactionGuild, "roles", roleId)
        this.props.description.push(
          inlineCode((roleId + "").padStart(20)) + ' [' + inlineCode(((await role.members.size) + "").padStart(4)) + ']: ' +
          mentionFuncs.roleMention(roleId)
        )
      }
      this.props.description.push("")
      this.props.description.push(
        // Start-End/Last
        start + "-" +
        end + (end != last ? `/${last}` : "")
      )
    }

    return !this.error
  }
}
