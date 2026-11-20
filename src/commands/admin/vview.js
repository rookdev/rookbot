// @ts-nocheck

// Formatters: userMention
const {
  inlineCode,
  codeBlock,
  ApplicationCommandOptionType,
  OverwriteType,
  ChannelType,
  bold,
  italic
} = require('discord.js')
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
          name: "role",
          description: "Role ID (Role)",
          type: ApplicationCommandOptionType.Role
        },
        {
          name: "member",
          description: "Member ID (User)",
          type: ApplicationCommandOptionType.User
        },
        {
          name: "channel",
          description: "Channel ID (Channel)",
          type: ApplicationCommandOptionType.Channel
        }
      ],
      playerTypes: {
        user:   "bot",
        target: "guild"
      },
      testOptions: [
        { "role":    "<@&1461760455532871740>" },
        { "member":  "<@1111517386588307536>" },
        { "channel": "<#1461760186682310788>" },
        { "role":    "<@&1461760455532871740>", "channel": "<#1461760186682310788>" },
        { "member":  "<@1111517386588307536>",  "channel": "<#1461760186682310788>" }
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
    let roleId    = coptions["role"] ? coptions["role"].replace(stripMentionPattern, '') : null
    let memberId  = coptions["member"] ? coptions["member"].replace(stripMentionPattern, '') : null
    let channelId = coptions["channel"] ? coptions["channel"].replace(stripMentionPattern, '') : null

    // Get Guild
    let guild = await this.getGuild(client, interaction)

    if (guild) {
      this.props.description = []
      this.props.description.push(bold("Guild"))
      this.props.description.push(mentionFuncs.guildMention(guild.name, guild.id, { showID: true }))
      this.props.description.push("")

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
        let avatar = ""
        switch(ChannelType[channel.type]) {
          case "GuildForum":    // Forum
            avatar = "https://em-content.zobj.net/source/lg/57/two-speech-bubbles_1f5ea.png"
            break
          case "GuildNews":     // Announcements
            avatar = "https://em-content.zobj.net/source/twitter/408/megaphone_1f4e3.png"
            break
          case "GuildVoice":    // Voice
            avatar = "https://em-content.zobj.net/source/twitter/408/speaker-high-volume_1f50a.png"
            break
          case "GuildCategory": // Category
            avatar = "https://em-content.zobj.net/source/twitter/408/file-folder_1f4c1.png"
            break
          default:
            avatar = "https://em-content.zobj.net/source/twitter/408/keycap-number-sign_23-fe0f-20e3.png"
            break
        }
        this.props.playerTypes.target = "target"
        this.props.entities.target = { avatar }

        // Roles in Channel
        this.props.description.push(bold("Channel Mention"))
        this.props.description.push(mentionFuncs.channelMention(channel.id, { showID: true }))
        this.props.description.push("")

        // If synced, get parent
        if (channel.permissionsLocked) {
          let category = await this.getChannel(client, interaction, channel.parentId)
          channel = category
          this.props.description.push(bold("Parent Mention"))
          this.props.description.push(`Synced with 📁${mentionFuncs.channelMention(category.id, { showID: true })}`)
          this.props.description.push("")
        }

        // Set ChannelRoles to all Roles
        channelRoles = await channel.permissionOverwrites.cache
      }

      // Role
      if (role || member) {
        if (role) {
          if (role?.icon) {
            this.props.playerTypes.target = "target"
            this.props.entities.target.avatar = await r.iconURL( { size: 128 })
          }
        } else if (member) {
          if (member?.avatar) {
            this.props.playerTypes.target = "target"
            this.props.entities.target.avatar = await member.displayAvatarURL( { size: 128 })
          }
        }
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
          this.props.description.push(bold("Role Mention"))
          this.props.description.push(mentionFuncs.roleMention(role.id, { showID: true }))
          this.props.description.push(this.profile.emojis.yes)
          this.props.description.push(codeBlock(role.permissions.toArray().join("\n")))
          let Table = new AsciiTable(
            `${client.profile.emojis.role}${role.name} of ⚔️ ${guild.name}`,
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
                chanRoleName = client.profile.emojis.role + chanOverwrite.name
                break
              case 1:
                chanRoleName = client.profile.emojis.user + chanOverwrite.user.username
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
