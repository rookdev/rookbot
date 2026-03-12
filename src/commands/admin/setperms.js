// @ts-nocheck

// Formatters
const {
  codeBlock,
  inlineCode,
  roleMention,
  ApplicationCommandOptionType,
  Application
} = require('discord.js')
// AdminCommand
const { AdminCommand } = require('../../classes/command/admincommand.class')
const mentionFuncs = require('../../utils/formatters/mentions')
const fileFuncs = require('../../utils/fs/fileFuncs')
const dbFuncs = require('../../utils/db/dbFuncs')

module.exports = class SetPermsCommand extends AdminCommand {
  constructor(client) {
    let comprops = {
      name: "setperms",
      category: "admin",
      description: "Manage Channel/Role Permissions",
      options: [
        {
          name: "channel-id",
          description: "Channel to check",
          type: ApplicationCommandOptionType.Channel
        },
        {
          name: "role-id",
          description: "Role to check",
          type: ApplicationCommandOptionType.String
        },
        {
          name: "profile-name",
          description: "Profile to set",
          type: ApplicationCommandOptionType.String
        }
      ],
      aliases: [
        {
          name: "chanperms",
          description: "Set Channel Permissions"
        },
        {
          name: "roleperms",
          description: "Set Role Permissions"
        }
      ],
      flags: {
        test: "basic"
      }
    }
    let props = {}

    super(
      client,
      {...comprops},
      {...props}
    )
  }

  // declare props: import('../../types/embed').EmbedProps

  async apply_profile(
    rGroup,
    profileToApply,
    permsByRoleID,
    roleChannelPerms,
    channel,
    role
  ) {
    let setMode = null
    let perms
    if (channel) {
      setMode = "channel"
      if (role) {
        setMode = "roleInChannel"
      }
      perms = {}
    } else if (role) {
      setMode = "role"
      perms = []
    }

    let applyMsg = ""
    applyMsg += `${this.profile.emojis.yes}To apply '${inlineCode(rGroup)}' `
    if (profileToApply.indexOf("override") > -1) {
      applyMsg += "OVERRIDE "
    }
    if (profileToApply.indexOf("stack") > -1) {
      applyMsg += "STACK "
    }
    applyMsg += `to ${role}`
    this.props.description.push(applyMsg)
    let dependencies = []
    if (permsByRoleID?.permsProfile?.dependencies) {
      dependencies = permsByRoleID.permsProfile.dependencies
    }
    if (profileToApply.indexOf("stack") > -1) {
      let profile = permsByRoleID.permsProfile[rGroup]
      if (setMode == "role") {
        dependencies = roleChannelPerms["rolePerms"][profile]?.profiles?.dependencies ?? dependencies
      } else {
        dependencies = roleChannelPerms["chanPerms"][profile]?.profiles?.dependencies ?? dependencies
      }
      dependencies.push(profile)
    }
    if (dependencies.length > 0) {
      for (let dep of dependencies) {
        if (setMode == "role") {
          perms = [...perms, ...roleChannelPerms["rolePerms"][dep].profiles[dep]]
        } else {
          perms = {...perms, ...roleChannelPerms["chanPerms"][dep].profiles[dep]}
        }
      }
    }
    if (permsByRoleID?.permsProfile[profileToApply]) {
      let dep = profileToApply
      if (setMode == "role") {
        perms = [...perms, ...roleChannelPerms["rolePerms"][dep].profiles[dep]]
      } else {
        perms = {...perms, ...roleChannelPerms["chanPerms"][dep].profiles[dep]}
      }
    }
    if (setMode == "role") {
      perms = [...new Set(perms)]
    }
    this.props.description.push(codeBlock(JSON.stringify(perms)))
    if (channel) {
      await channel.permissionOverwrites.create(
        role,
        perms
      )
    } else {
      try {
        await role.setPermissions(perms)
      } catch (error) {
        this.messages.push(`Error setting permissions for @${role.name} [${profileToApply}]`)
      }
      // this.messages.push(`@${role.name} ${perms}`)
    }
  }

  async action(client, interaction, coptions={}) {
    let channelID = coptions["channel-id"] ?? null
    let roleID = coptions["role-id"]?.replace(/[<#@&!>]/g, '')
    let profileToApply = coptions["profile-name"] ?? null
    let channel = null
    let role = { name: "@everyone", id: 0 }
    let printPerms = false
    let permsByRoleID = {}
    let guildRoles = {}
    let setMode = null

    this.props.description = []

    this.props.entities = {
      GuildCategory: {
        avatar: "https://em-content.zobj.net/source/twitter/408/file-folder_1f4c1.png"
      },
      GuildRole: {
        avatar: "https://em-content.zobj.net/source/twitter/408/busts-in-silhouette_1f465.png"
      },
      GuildText: {
        avatar: "https://em-content.zobj.net/source/twitter/408/keycap-number-sign_23-fe0f-20e3.png"
      },
      GuildVoice: {
        avatar: "https://em-content.zobj.net/source/twitter/408/speaker-high-volume_1f50a.png"
      }
    }
    this.props.playerTypes = { user: "bot", target: "guild" }

    if (channelID) {
      channel = await this.getCache(client, interaction.guild, "channels", channelID)
      setMode = "channel"
    }

    if ((!roleID) || roleID == "" || (coptions["role-id"].indexOf("@everyone") > -1)) {
      roleID = "@everyone"
    }

    let mention = inlineCode("@everyone")
    if (roleID.indexOf("@everyone") > -1) {
      role = await interaction.guild.roles.everyone
    } else {
      role = await this.getCache(client, interaction.guild, "roles", roleID)
    }

    if (role) {
      this.props.description.push(`Scanning Perms for: ${mentionFuncs.roleMention(role.id, { showID: true })}`)
      setMode = "role"
      if (channel) {
        setMode = "roleInChannel"
      }
    } else {
      this.messages.push(`Role '${roleID}' not found!`)
    }

    let roleChannelPerms = {}
    if (setMode) {
      roleChannelPerms = fileFuncs.getAFile(
        [
          "src",
          "dbs"
        ],
        "roleChannelPerms.json"
      )
    }

    if (setMode == "channel" || setMode == "roleInChannel") {
      this.props.playerTypes.target = "GuildText"
      permsByRoleID["permsProfile"] = roleChannelPerms["chanPerms"]
      if (Object.keys(roleChannelPerms["chanPerms"]).includes(profileToApply)) {
        permsByRoleID["permsProfile"] = roleChannelPerms["chanPerms"][profileToApply]["profiles"]
      }
      this.props.description.push(`In: ${mentionFuncs.channelMention(channel.id, { showID: true })}`)
      if (channel.permissionsLocked) {
        this.props.playerTypes.target = "GuildCategory"
        this.props.description.push(`Channel Perms Synced for ${channel}: 🔁`)
        channel = await this.getCache(client, interaction.guild, "channels", channel.parentId)
        this.props.description.push(`Loading Category Instead: ${mentionFuncs.channelMention(channel.id, { showID: true })}`)
      }

      let foundPermsForRole = false
      let isEveryone = false
      // Cycle through roles that have existing permissions settings
      for (let [oID, oData] of channel.permissionOverwrites.cache) {
        let role = await this.getCache(client, interaction.guild, "roles", oID)
        if (coptions["role-id"]) {
          isEveryone = (coptions["role-id"].indexOf("@everyone") > -1) && (role.name.indexOf("@everyone") > -1)
        }
        printPerms = false
        if (
          oID == roleID ||
          role.name == roleID
        ) {
          foundPermsForRole = true
          printPerms = true
        }
        let perms = {
          "roleData": {
            "id": oID,
            "name": role.name
          },
          "byCat": {
            "allow": [],
            "neutral": [],
            "deny": []
          },
          "byName": {}
        }
        if (printPerms || isEveryone) {
          this.props.description.push("---")
          this.props.description.push(`Role ID: ${mentionFuncs.roleMention(role.id, { showID: true })}`)
        }
        if (oData.allow) {
          perms.byCat.allow = oData.allow.toArray()
          for (let perm of perms.byCat.allow) {
            perms.byName[perm] = "allow"
          }
        }
        if (oData.deny) {
          perms.byCat.deny = oData.deny.toArray()
          for (let perm of perms.byCat.deny) {
            perms.byName[perm] = "deny"
          }
        }

        // Print current state of perms for this role
        if (Object.keys(perms.byName).length <= 0) {
          if (printPerms || isEveryone) {
            this.props.description.push("No perms set!")
          }
        } else {
          for (let [pName, pVal] of Object.entries(perms.byName)) {
            let msg = inlineCode(pName + ':')
            switch(pVal) {
              case "allow":
                msg += this.profile.emojis.good
                break
              case "neutral":
                msg += this.profile.emojis.current
                break
              case "deny":
                msg += this.profile.emojis.bad
                break
            }
            if (printPerms || isEveryone) {
              this.props.description.push(msg)
            }
          }
        }
        permsByRoleID[oID] = perms
      }
      this.props.description.push("---")
      if (foundPermsForRole || isEveryone) {
        this.props.description.push(`${this.profile.emojis.check}Found Perms for ${role || '@everyone'}!`)
      } else {
        this.props.description.push(`${this.profile.emojis.nocheck}No Perms for ${role || '@everyone'}!`)
      }
    }

    if (setMode == "role") {
      this.props.playerTypes.target = "GuildRole"
      permsByRoleID["permsProfile"] = roleChannelPerms["rolePerms"]
      if (Object.keys(roleChannelPerms["rolePerms"]).includes(profileToApply)) {
        permsByRoleID["permsProfile"] = roleChannelPerms["rolePerms"][profileToApply]["profiles"]
      }
      this.props.description.push(
        `In: ${mentionFuncs.guildMention(interaction.guild.name, interaction.guild.id, { showID: true })}`,
        "---",
        `Role ID: ${mentionFuncs.roleMention(role.id, { showID: true })}`
      )
      let perms = role.permissions.toArray()
      for (let perm of perms) {
        this.props.description.push(
          `${inlineCode(perm)}: ${this.profile.emojis.check}`
        )
      }
      this.props.description.push("---")
      if (perms.length > 0) {
        this.props.description.push(`${this.profile.emojis.check}Found Perms for ${role || '@everyone'}!`)
      } else {
        this.props.description.push(`${this.profile.emojis.nocheck}No Perms for ${role || '@everyone'}!`)
      }
    }

    if (profileToApply) {
      this.props.description.push("---")

      // DB
      let dbRes = await dbFuncs.getDB(
        interaction.guild.id,
        "roles"
      )
      guildRoles = dbRes[0]
      this.messages.push(...dbRes[1])
      // /DB

      this.props.description.push(`${this.profile.emojis.dev}Loading Role Profile: '${inlineCode(profileToApply)}'`)
      // If it's an override profile
      if (profileToApply.indexOf("override") > -1) {
        let rGroup = profileToApply
        let perms = {}
        if (Object.keys(permsByRoleID["permsProfile"]).includes(rGroup)) {
          await this.apply_profile(
            rGroup,
            profileToApply,
            permsByRoleID,
            roleChannelPerms,
            channel,
            role
          )
        }
      } else if (role?.name?.indexOf("@everyone") > -1) {
        // If it's an @everyone profile
        let rGroup = "@everyone"
        if (Object.keys(permsByRoleID["permsProfile"]).includes(rGroup)) {
          await this.apply_profile(
            rGroup,
            profileToApply,
            permsByRoleID,
            roleChannelPerms,
            channel,
            role
          )
        }
      } else {
        // Cycle through guild roles
        for (let [rGroup, rList] of Object.entries(guildRoles)) {
          if (Object.keys(permsByRoleID["permsProfile"]).includes(rGroup)) {
            for (let applyRole of rList) {
              this.props.description.push(`${this.profile.emojis.success}Role Profile '${inlineCode(rGroup)}' exists for '${inlineCode('@' + applyRole)}'`)
              if (profileToApply.indexOf("stack") > -1) {
                let thisRole = await this.getCache(client, interaction.guild, "roles", applyRole)
                await this.apply_profile(
                  rGroup,
                  profileToApply,
                  permsByRoleID,
                  roleChannelPerms,
                  channel,
                  thisRole
                )
              }
            }
          }
        }
      }
    }

    return !this.error
  }
}
