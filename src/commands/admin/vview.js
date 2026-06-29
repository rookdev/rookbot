// @ts-nocheck

// Formatters: userMention
const { userMention, inlineCode, codeBlock, ApplicationCommandOptionType, OverwriteType, italic } = require('discord.js')
// AdminCommand
const { AdminCommand } = require('../../classes/command/admincommand.class')
const mentionFuncs = require('../../utils/formatters/mentions')
const AsciiTable = require('ascii-table')
const dbFuncs = require('../../utils/db/dbFuncs')
const moment = require('moment')

/**
 * @class
 * @classdesc
 * @this VerboseViewCommand}
 * @extends {AdminCommand}
 * @public
 */
module.exports = class VerboseViewCommand extends AdminCommand {
  constructor(client) {
    let comprops = {
      name: "vview",
      category: "admin",
      description: "Verbose View",
      options: [
        {
          name: "role-id",
          description: "Role ID",
          type: ApplicationCommandOptionType.Role
        },
        {
          name: "member-id",
          description: "Member ID",
          type: ApplicationCommandOptionType.User
        },
        {
          name: "channel-id",
          description: "Channel ID",
          type: ApplicationCommandOptionType.Channel
        }
      ],
      testOptions: [
        { "role-id":    "<@&1461760455532871740>" },
        { "member-id":  "<@1111517386588307536>" },
        { "channel-id": "<#1461760186682310788>" },
        { "role-id":    "<@&1461760455532871740>", "channel-id": "<#1461760186682310788>" },
        { "member-id":  "<@1111517386588307536>",  "channel-id": "<#1461760186682310788>" }
      ]
    }
    let props = {
      title: {
        text:   "Verbose View"
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
    let stripMentionPattern = /[<#@&!>]/g
    let roleId    = coptions["role-id"] ? coptions["role-id"].replace(stripMentionPattern, '') : null
    let memberId  = coptions["member-id"] ? coptions["member-id"].replace(stripMentionPattern, '') : null
    let channelId = coptions["channel-id"] ? coptions["channel-id"].replace(stripMentionPattern, '') : null

    // Get Guild
    let guild = await this.getGuild(client, interaction)

    if (guild) {
      this.props.description = []
      this.props.description.push(mentionFuncs.guildMention(guild.name, guild.id))

      let role = null
      let member = null
      let channel = null
      if (roleId) {
        role = await this.getCache(client, guild, "roles", roleId)
        if (!role) {
          this.error = true
          this.props.description.push(`Role ${inlineCode(roleId)} not found in ${italic(guild.name)}`)
          return false
        }
      }
      if (channelId) {
        channel = await this.getChannel(client, interaction, channelId)
        if (!channel) {
          this.error = true
          this.props.description.push(`Channel ${inlineCode(channelId)} not found in ${italic(guild.name)}`)
          return false
        }
      }
      if (memberId) {
        if (!channel) {
          this.error = true
          this.props.description.push(`Member mode needs a channel!`)
        }
        member = await this.getCache(client, guild, "members", memberId)
        if (!member) {
          this.error = true
          this.props.description.push(`Member ${inlineCode(memberId)} not found in ${italic(guild.name)}`)
        }
        if (this.error) {
          return false
        }
      }

      let channelRoles = null

      // Channel
      if (channel) {
        // Roles in Channel
        this.props.description.push(mentionFuncs.channelMention(channel.id))

        // If synced, get parent
        if (channel.permissionsLocked) {
          let category = await this.getChannel(client, interaction, channel.parentId)
          channel = category
          this.props.description.push(`Synced with 📁${mentionFuncs.channelMention(category.id)}`)
        }

        // Set ChannelRoles to all Roles
        channelRoles = await channel.permissionOverwrites.cache
      }

      // Role
      if (role || member) {
        if (channel) {
          // Role/Member in Channel
          // Set ChannelRoles to this Role/Member
          if (role) {
            channelRoles = channelRoles.filter(r => r.id === role.id)
          } else if (member) {
            channelRoles = channelRoles.filter(r => r.id === member.id)
          }
        } else if (role && (!member)) {
          // Role in Server (not Member)
          this.props.description.push(mentionFuncs.roleMention(role.id))
          this.props.description.push(this.profile.emojis.yes)
          this.props.description.push(codeBlock(role.permissions.toArray().join("\n")))
          let Table = new AsciiTable(
            `👥${role.name} of ⚔️ ${guild.name}`,
            {}
          )
            .setBorder('|','-','•','•')
            .setHeading(
              "Perm",
              "Deny",
              "",
              "Allow"
            )
          let perms = role.permissions.toArray()
          perms.sort()
          for (let perm of perms) {
            Table.addRow(
              `📝${perm}`,
              "",
              "",
              this.profile.emojis.yes
            )
          }
          this.messages.push(Table.toString())
        }
      }

      if (channelRoles) {
        // Roles in Channel
        this.props.description.push("")
        let chanPerms = {}
        chanPerms.byPerm = {}
        chanPerms.byEntity = {}

        for (let [chanRoleId, chanRolePerms] of channelRoles) {
          chanPerms.byEntity[chanRoleId] = {
            type: chanRolePerms.type,
            id: chanRoleId
          }
          if (chanRolePerms.type == 0) {
            let role = await this.getCache(client, guild, "roles", chanRoleId)
            let numRoles = await guild.roles.fetch()
            numRoles = numRoles.size
            chanPerms.byEntity[chanRoleId]["ranking"] = numRoles - role.position
          }
          this.props.description.push(
            `Channel Privs for ` +
            (
              (chanRolePerms.type == 0)
              ? (mentionFuncs.roleMention(chanRoleId)) + (` [#${chanPerms.byEntity[chanRoleId].ranking}]`)
              : (mentionFuncs.userMention(chanRoleId))
            )
          )
          let allow = null
          let deny = null
          let perms = []
          if (chanRolePerms.allow) {
            allow = chanRolePerms.allow.toArray()
            allow.sort()
            perms = [...perms, ...allow]
          }
          if (chanRolePerms.deny) {
            deny = chanRolePerms.deny.toArray()
            deny.sort()
            perms = [...perms, ...deny]
          }
          if (allow && allow != "") {
            chanPerms.byEntity[chanRoleId]["allow"] = allow
            this.props.description.push(
              this.profile.emojis.yes + ": " +
              inlineCode(JSON.parse(JSON.stringify(allow)).join(", "))
            )
          }
          if (deny && deny != "") {
            chanPerms.byEntity[chanRoleId]["deny"] = deny
            this.props.description.push(
              this.profile.emojis.no + ": " +
              inlineCode(JSON.parse(JSON.stringify(deny)).join(", "))
            )
          }
          this.props.description.push("")
          let chanOverwrite = await this.getCache(
            client,
            guild,
            OverwriteType[chanRolePerms.type].toLowerCase() + "s",
            chanRoleId
          )
          let chanRoleName = chanRoleId
          if (chanOverwrite) {
            switch(chanRolePerms.type) {
              case 0:
                chanRoleName = "👥" + chanOverwrite.name
                break
              case 1:
                chanRoleName = "👤" + chanOverwrite.user.username
                break
            }
          }
          chanPerms.byEntity[chanRoleId]["name"] = chanRoleName

          let Table = new AsciiTable(
            `${chanRoleName} [#] of ⚔️ ${guild.name} in #️⃣ ${channel.name}`.replace(
              " [#]",
              chanPerms.byEntity[chanRoleId]?.ranking
              ? ` [#${chanPerms.byEntity[chanRoleId].ranking}]`
              : ""
            ),
            {}
          )
            .setBorder('|','-','•','•')
            .setHeading(
              "Perm",
              "Deny",
              "",
              "Allow"
            )
          perms.sort()
          for (let perm of perms) {
            let permBool = null
            if (deny && (deny.indexOf(perm) > -1)) {
              permBool = false
            } else if (allow && (allow.indexOf(perm) > -1)) {
              permBool = true
            }
            if (permBool !== null) {
              if (!chanPerms.byPerm[perm]) {
                chanPerms.byPerm[perm] = {}
              }
              chanPerms.byPerm[perm][chanRoleId] = permBool
            }
            Table.addRow(
              `📝${perm}`,
              ((deny && (deny.indexOf(perm) > -1)) && (this.profile.emojis.no) || " "),
              " ",
              ((allow && (allow.indexOf(perm) > -1)) && (this.profile.emojis.yes) || " ")
            )
          }

          this.messages.push(Table.toString())
        }
        let perms = Object.keys(chanPerms.byPerm)
        perms.sort()
        for (let perm of perms) {
          let entities = chanPerms.byPerm[perm]
          let Table = new AsciiTable(
            `📝${perm} for #️⃣ ${channel.name} of ⚔️ ${guild.name}`,
            {}
          )
            .setBorder('|','-','•','•')
            .setHeading(
              "Entity",
              "Ranking",
              "ID",
              "Deny",
              "",
              "Allow"
            )
          let entityIds = Object.keys(entities)
          entityIds.sort()
          for (let entityId of entityIds) {
            let val = entities[entityId]
            Table.addRow(
              chanPerms.byEntity[entityId].name,
              chanPerms.byEntity[entityId].ranking,
              chanPerms.byEntity[entityId].id,
              (val == false) && (this.profile.emojis.no) || " ",
              " ",
              (val == true) && (this.profile.emojis.yes) || " "
            )
          }
          if (Object.keys(chanPerms.byEntity).length > 1) {
            this.messages.push(Table.toString())
          }
        }
      }
    } else {
      this.error = true
      this.props.description.push(`Guild not found`)
      return false
    }
  }
}
