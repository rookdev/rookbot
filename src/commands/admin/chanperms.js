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
const fileFuncs = require('../../utils/fs/fileFuncs')

module.exports = class ChanPermsCommand extends AdminCommand {
  constructor(client) {
    let comprops = {
      name: "chanperms",
      category: "admin",
      description: "Manage Channel Permissions",
      options: [
        {
          name: "channel-id",
          description: "Channel to check",
          type: ApplicationCommandOptionType.Channel,
          required: true
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
    this.props.description.push(`${this.profile.emojis.yes}To apply '${inlineCode(rGroup)}' STACK to ${role}`)
    let perms = {}
    let dependencies = []
    if (permsByRoleID?.permsProfile?.dependencies) {
      dependencies = permsByRoleID.permsProfile.dependencies
    }
    if (profileToApply.indexOf("stack") > -1) {
      let profile = permsByRoleID.permsProfile[rGroup]
      dependencies = roleChannelPerms[profile]?.profiles?.dependencies ?? dependencies
      dependencies.push(profile)
    }
    if (dependencies.length > 0) {
      for (let dep of dependencies) {
        perms = {...perms, ...roleChannelPerms[dep].profiles[dep]}
      }
    }
    this.props.description.push(codeBlock(JSON.stringify(perms)))
    await channel.permissionOverwrites.create(
      role,
      perms
    )
  }

  async action(client, interaction, coptions={}) {
    let channelID = coptions["channel-id"] ?? null
    let roleID = coptions["role-id"]?.replace(/[<#@&!>]/g, '') ?? "@everyone"
    let profileToApply = coptions["profile-name"] ?? null
    let channel = null
    let printPerms = false

    if (!channelID) {
      channel = interaction.channel
    } else {
      channel = await interaction.guild.channels.cache.get(channelID)
    }

    if (channel) {
      this.props.description = []
      let role = { name: "@everyone", id: 0 }
      let mention = inlineCode("@everyone")
      if (coptions["role-id"] == "@everyone") {
        role = await interaction.guild.roles.cache.find(r => r.name == "@everyone")
      } else {
        role = await interaction.guild.roles.cache.get(roleID)
      }

      if (role) {
        mention = roleMention(role.id)
        this.props.description.push(`Scanning Perms for: ${mention} [${inlineCode(role.id)}]`)
      } else {
        console.log(`Role '${roleID}' not found!`)
      }

      this.props.description.push(`In: ${channel} [${inlineCode(channel.id)}]`)
      if (channel.permissionsLocked) {
        this.props.description.push(`Channel Perms Synced for ${channel}: ${channel.permissionsLocked ? this.profile.emojis.check : this.profile.emojis.nocheck}`)
        channel = await interaction.guild.channels.cache.get(channel.parentId)
        this.props.description.push(`Loading Category Instead: ${channel} [${inlineCode(channel.id)}]`)
      }

      let permsByRoleID = {}
      let foundPermsForRole = false
      let isEveryone = false
      // Cycle through roles that have existing permissions settings
      for (let [oID, oData] of channel.permissionOverwrites.cache) {
        let role = await interaction.guild.roles.cache.get(oID)
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
          this.props.description.push(`Role ID: ${role} [${inlineCode(oID)}]`)
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

      // Apply a profile
      this.props.description.push("---")
      if (profileToApply) {
        let roleChannelPerms = fileFuncs.getAFile(
          [
            "src",
            "dbs"
          ],
          "roleChannelPerms.json"
        )
        permsByRoleID["permsProfile"] = roleChannelPerms
        if (Object.keys(roleChannelPerms).includes(profileToApply)) {
          permsByRoleID["permsProfile"] = roleChannelPerms[profileToApply]["profiles"]
        }
        let guildRoles = fileFuncs.getAFile(
          [
            "src",
            "dbs",
            interaction.guild.id
          ],
          "roles.json"
        )
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
        } else if (role?.name == "@everyone") {
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
                  let thisRole = await interaction.guild.roles.cache.find(r=>r.name==applyRole)
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
              if (role) {
                if (rList.includes(role.name)) {
                  await this.apply_profile(
                    rGroup,
                    profileToApply,
                    permsByRoleID,
                    roleChannelPerms,
                    channel,
                    role
                  )
                }
              }
            }
          }
        }
      }
      // console.log(permsByRoleID)
    }

    return !this.error
  }
}
