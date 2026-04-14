// @ts-nocheck

const { ApplicationCommandOptionType, AttachmentBuilder, ChannelType, PermissionFlagsBits } = require('discord.js')
// AdminCommand
const { AdminCommand } = require('../../classes/command/admincommand.class')
// Pretty-print time durations
const mentionFuncs = require('../../utils/formatters/mentions')
const globalFuncs = require('../../utils/primitives/globalFuncs')
const fileFuncs = require('../../utils/fs/fileFuncs')

module.exports = class ServerProfileCommand extends AdminCommand {
  constructor(client) {
    let comprops = {
      name: "server_profile",
      category: "admin",
      description: "Server Profile",
      options: [
        {
          name: "manifest",
          description: "Server Profile Manifest",
          type: ApplicationCommandOptionType.Attachment,
          required: true
        },
        {
          name: "profile-name",
          description: "Profile Name",
          type: ApplicationCommandOptionType.String
        },
        {
          name: "args",
          description: "Arguments",
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

  async action(client, interaction, coptions={}) {
    let args          = coptions?.args?.split(",")
    let manifestAtch  = interaction.options.getAttachment("manifest")
    let manifestJSON  = await fileFuncs.getAURL(manifestAtch.attachment, "json")

    if (!args) {
      args = manifestJSON.profiles.args.join(",").split(",")
    }

    let profileName = coptions["profile-name"] ?? "team"
    let profile = null
    if (manifestJSON?.profiles) {
      if (profileName) {
        if (manifestJSON?.profiles[profileName]) {
          profile = manifestJSON.profiles[profileName]
        }
      } else {
        [profileName, profile] = Object.entries(manifestJSON.profiles)[0]
      }
    } else if (manifestJSON?.profile) {
      profile = manifestJSON.profile
    }

    let role = profile?.role?.name.trim() ?? profile?.role?.id.trim()
    let category = profile?.category?.name .trim()?? profile?.category?.id.trim()
    let channels = profile.category.channels

    let i = 1
    for (let arg of args) {
      role = role.replace(`{arg${i}}`, arg.trim())
      category = category.replace(`{arg${i}}`, arg.trim())
      i++
    }

    let guild = await this.getGuild(client, interaction)
    let guildCategory = null
    let accessRole = null

    this.messages.push(
      `_0_${role}`,
      ` >${category}`
    )

    // Make role
    if (profile?.role) {
      let guildRoles = await guild.roles.cache
        .valueOf()
        .map(role => role.name)
        .filter(roleName => roleName != "@everyone")

      // If we don't have it already, make it
      if (!guildRoles.contains(role)) {
        let rolePosition = null
        if (profile.role?.above || profile.role?.below) {
          let relRole = await this.getCache(
            client,
            guild,
            "roles",
            profile.role?.above ?? profile.role?.below
          )
          // Higher number is higher position
          if (profile.role?.above) {
            rolePosition = relRole.position + 1
          } else if (profile.role?.below) {
            rolePosition = relRole.position - 1
          }
        }
        let newRole = {
          name: role
        }
        if (profile.role?.color) {
          newRole.colors = profile.role.color
        }
        if (rolePosition) {
          newRole.position = rolePosition
        }
        accessRole = await guild.roles.create(newRole)
      } else {
        accessRole = await this.getCache(client, guild, "roles", role)
      }
    }
    // Make category
    if (profile?.category) {
      let chanCache = guild.channels.cache
      if (globalFuncs.isStoat(client)) {
        chanCache = guild.categories
      }
      let guildCategories = []

      for (let [cID, channel] of chanCache) {
        if (
          (channel.type == ChannelType.GuildCategory) ||
          (channel?.children?.size > 0)
        ) {
          guildCategories.push(channel)
        }
      }
      // this.messages.push(
      //   JSON.stringify(
      //     {
      //       guildCategories: guildCategories.map(
      //         c => [ c.name, c.id ]
      //       )
      //     }
      //   )
      // )

      guildCategories = guildCategories.filter(
        c => (
          c.name == category ||
          c.id == category
        )
      )

      // this.messages.push(
      //   JSON.stringify(
      //     {
      //       foundCategory: guildCategories.map(
      //         c => [ c.name, c.id ]
      //       )
      //     }
      //   )
      // )

      if (globalFuncs.empty(guildCategories)) {
        let catPerms = []
        let rolePerms = {}

        // Everyone
        rolePerms = {
          deny: [ PermissionFlagsBits.ViewChannel ]
        }
        catPerms.push(
          {
            id: guild.roles.everyone.id,
            ...rolePerms
          }
        )

        if (profile?.category?.permissions) {
          for (let [pRoleName, pRolePerms] of Object.entries(profile.category.permissions)) {
            i = 1
            for (let arg of args) {
              pRoleName = pRoleName.replace(`{arg${i}}`, arg.trim())
              i++
            }
            let pRole = await this.getCache(client, guild, "roles", pRoleName)
            if (pRole) {
              let allowPerms = pRolePerms?.allow
              let denyPerms = pRolePerms?.deny
              rolePerms = {}
              if (allowPerms && !globalFuncs.empty(allowPerms)) {
                rolePerms.allow = []
                for (let perm of allowPerms) {
                  rolePerms.allow.push(PermissionFlagsBits[perm])
                }
              }
              if (denyPerms && !globalFuncs.empty(denyPerms)) {
                rolePerms.deny = []
                for (let perm of denyPerms) {
                  rolePerms.deny.push(PermissionFlagsBits[perm])
                }
              }
              catPerms.push(
                {
                  id: pRole.id,
                  ...rolePerms
                }
              )
            }
          }
        }

        console.log(catPerms)

        let guildCatProps = {
          name: category,
          type: ChannelType.GuildCategory,
          permissionOverwrites: catPerms
        }
        guildCategory = await guild.channels.create(guildCatProps)
      } else {
        guildCategory = guildCategories[0]
      }

      // this.messages.push(
      //   JSON.stringify(
      //     {
      //       finalCategory: {
      //         name: guildCategory.name,
      //         id: guildCategory.id
      //       }
      //     }
      //   )
      // )
    }

    let catChildNames = []
    if (guildCategory?.children) {
      catChildNames = guildCategory.children.cache.map(
        c => c.name
      )
    }

    for (let channel of channels) {
      let chanName = channel.name
      i = 1
      for (let arg of args) {
        chanName = chanName.replace(`{arg${i}}`, arg.trim())
        if (channel.type == "text") {
          chanName = chanName
            .replaceAll(" ", "-")
            .toLowerCase()
        }
        i++
      }

      let chanType = ""
      let newChanType = 0
      switch(channel.type) {
        case "text":
          chanType = "#"
          newChanType = ChannelType.GuildText
          break
        case "voice":
          chanType = ".o)"
          newChanType = ChannelType.GuildVoice
          break
      }

      if (!catChildNames.contains(chanName)) {
        await guild.channels.create(
          {
            name: chanName,
            type: newChanType,
            parent: guildCategory
          }
        )
      }

      this.messages.push(`  ${chanType}${chanName}`)
    }

    let outputAtch = new AttachmentBuilder()
      .setName("output.json")
      .setFile(Buffer.from(JSON.stringify(manifestJSON, null, "  ")))

    await interaction.editReply(
      {
        content: "See attached!",
        files: [ outputAtch ]
      }
    )
    this.null = true

    return !this.error
  }
}
