// @ts-nocheck

// Command Option Types
const { ApplicationCommandOptionType, ChannelType, GuildEmoji } = require('discord.js')
// Base Rook Command
const { RookCommand } = require('../../classes/command/rcommand.class.js')
const timeFormat = require('../../utils/timeFormat.js')

module.exports = class MentionCommand extends RookCommand {
  constructor(client) {
    let comprops = {
      name: "mention",
      category: "meta",
      description: "Give code to post a mention in chat",
      flags: { target: "required" },
      options: [
        {
          name: "target-id",
          description: "ID of target",
          type: ApplicationCommandOptionType.String,
          required: true
        },
        {
          name: "target-type",
          description: "Mention Type",
          type: ApplicationCommandOptionType.String,
          choices: [
            { name: "Channel",        value: "channel" },
            { name: "Emoji",          value: "emoji" },
            { name: "Role",           value: "role" },
            { name: "Text Channel",   value: "channel" },
            { name: "User",           value: "user" },
            { name: "Voice Channel",  value: "channel" }
          ]
        }
      ],
      aliases: [
        {
          name: "channelinfo",
          description: "Get info about a Channel",
          options: { "target-type": "channel "}
        },
        {
          name: "emojiinfo",
          description: "Get info about an Emoji",
          options: { "target-type": "emoji" }
        },
        {
          name: "roleinfo",
          description: "Get info about a Role",
          options: { "target-type": "role" }
        },
        {
          name: "vcinfo",
          description: "Get info about a Voice Channel",
          options: { "target-type": "channel" }
        }
      ],
      testOptions: [
        { "target-id": "<#895062573999878234>" },                 // #bot-console
        { "target-id": "<:heartcontainer:1323926395868549161>" }, // :heartcontainer:
        { "target-id": "<@&833812507012366366>" },                // @Admin
        { "target-id": "<@!263968998645956608>" },                // @Minnie
        { "target-id": "<@!1111517386588307536>" },               // @castIe
        { "target-id": "<#!1097065219014021130>" }                // Voice:General
      ]
    }
    let props = {
      title: {
        text: "Mention Helper"
      }
    }

    super(
      client,
      {...comprops},
      {...props}
    )
  }

  // declare props: import('../../types/embed').EmbedProps

  async action(client, interaction, coptions) {
    // Get Target Input
    let targetInput   = coptions["target-id"]
    // Get Target ID
    let targetId      = targetInput.replace(/[<#@&!>]/g, '')  // Remove <@>, <@!>, and >
    // Get Target Type
    let targetType    = coptions["target-type"] ?? "channel"
    let targetMention = ""

    // console.log(
    //   [
    //     `/mention: Input`,
    //     `Input:    ${targetInput}`,
    //     `ID:       ${targetId}`,
    //     `InType:   ${targetType}`
    //   ].join("\n")
    // )

    for(let [check, mentionType] of Object.entries
      (
        // Check for Mention Type
        {
          "\@\!": "user",
          "@":    "user",
          "\#\!": "channel",
          "#":    "channel",
          ":":    "emoji"
        }
      )
    ) {
      if(targetInput.includes(check)) {
        targetType = mentionType
      }
    }
    // If @&, it's a Role Mention
    if(targetInput.includes("@") && targetInput.includes("&")) {
      targetType = "role"
    }
    if (targetType == "emoji") {
      targetId = targetId.substring(targetId.indexOf(':', 2) + 1)
    }

    // console.log(
    //   `CalcType: ${targetType}`
    // )

    this.props.playerTypes = {
      user: "bot",
      target: "guild"
    }
    this.props.entities = {}

    let specs = {}

    // Get Guild
    let guild = await client.guilds.fetch(interaction?.guild?.id)

    switch(targetType) {
      // Channel
      case "channel":
        targetMention = `<#${targetId}>`
        if (guild) {
          let channel = null
          try {
            channel = await guild.channels.fetch(targetId)
          } catch (error) {
            this.error = true
            this.props.description = `Channel ` + targetId.inlinecode() + ` not found in *${guild.name}*`
            return false
          }
          if (channel) {
            specs = {
              name: channel?.name,
              topic: channel?.topic,
              subtype: ChannelType[channel.type],
              position: channel?.position,
              extra: channel?.flags?.toArray().join(", ")
            }
            if (specs.extra) {
              specs.extra = specs.extra.codeblock()
            }
            if (channel?.createdTimestamp) {
              specs.creationStr = timeFormat(channel?.createdTimestamp, { with: "relative" })
            }

            // Set Target to Channel
            let avatar = ""
            switch (specs?.subtype) {
              case "GuildVoice":
                avatar = "https://em-content.zobj.net/source/twitter/408/speaker-high-volume_1f50a.png"
                break
              default:
                avatar = "https://em-content.zobj.net/source/twitter/408/keycap-number-sign_23-fe0f-20e3.png"
                break
            }
            this.props.playerTypes = {
              user: "target",
              target: "target"
            }

            this.props.entities = {
              target: {
                name: specs.name,
                avatar: avatar
              }
            }
          }
        }
        break
      // Emoji
      case "emoji":
        if (guild) {
          let emoji = null
          try {
            emoji = await guild.emojis.fetch(targetId)
          } catch (error) {
            this.error = true
            this.props.description = `Emoji ` + targetId.inlinecode() + ` not found in *${guild.name}*`
            return false
          }
          if (emoji) {
            targetMention = `<:${specs.name}:${targetId}>`
            specs = {
              name: emoji?.name,
              url: emoji?.imageURL({ size: Math.pow(2, 7) }),
              animated: emoji?.animated ? this.profile.emojis.check : this.profile.emojis.nocheck
            }
            if (emoji?.createdTimestamp) {
              specs.creationStr = timeFormat(emoji?.createdTimestamp, { with: "relative" })
            }

            if (specs?.url) {
              // Set Target to Emoji
              this.props.playerTypes = {
                user: "target",
                target: "target"
              }
              this.props.entities = {
                target: {
                  name: specs.name,
                  avatar: specs.url
                }
              }
            }
          }
        }
        break
      // Role
      case "role":
        targetMention = `<@&${targetId}>`
        if (guild) {
          let role = await guild.roles.fetch(targetId)
          if (role) {
            specs = {
              name: role?.name,
              url: role?.iconURL({ size: Math.pow(2, 7) }),
              hoisted: role?.hoist ? this.profile.emojis.check : this.profile.emojis.nocheck,
              position: role?.position
            }

            this.props.color = role?.hexColor

            if (role?.createdTimestamp) {
              specs.creationStr = timeFormat(role?.createdTimestamp, { with: "relative" })
            }

            // Set Target to Role Icon
            this.props.playerTypes = {
              user: "target",
              target: "target"
            }
            this.props.entities = {
              target: {
                name: specs?.name,
                avatar: specs?.url
              }
            }
          }
        }
        break
      // User
      case "user":
        targetMention = `<@!${targetId}>`
        if (guild) {
          // Get Guild Member
          let targetMember = await guild?.members?.fetch(targetId)
          if (targetMember) {
            specs = {
              name: targetMember.user.username
            }
            const roles = await targetMember
              .roles
              .valueOf()
              .sort(
                (roleA, roleB) => roleB.position - roleA.position
              )
              .map(
                role => role.name
              )
              .filter(
                roleName => roleName != "@everyone"
              )
            if (roles) {
              specs.roles = roles
            }

            specs.highest = await targetMember.roles.highest
            specs.roleIcon = await targetMember.roles.icon?.iconURL({ size: Math.pow(2, 7) })

            if (specs?.highest) {

              let numRoles = await guild.roles.fetch()
              numRoles = numRoles.size
              let highName = specs.highest.name
              let highRank = numRoles - specs.highest.position
              if (await targetMember.guild.ownerId === targetId) {
                highName = "Server Owner"
                highRank = "0"
                specs.roles = ["Server Owner", ...specs.roles]
              }
              specs.highest = `; highest is ${highName} [#${highRank}]`
            }

            if (targetMember?.user?.createdTimestamp) {
              specs.creationStr = timeFormat(targetMember?.user?.createdTimestamp, { with: "relative" })
            }
            if (targetMember?.joinedTimestamp) {
              specs.joinedStr = timeFormat(targetMember?.joinedTimestamp, { with: "relative" })
            }

            // Set Target to Member
            this.props.playerTypes = {
              user: "target",
              target: "target"
            }
            this.props.entities = {
              target: {
                type:   "target",
                id:     targetId,
                name:   targetMember.displayName,
                url:    "http://example.com/target",
                avatar: specs?.roleIcon ?? targetMember.displayAvatarURL({ size: Math.pow(2, 7) }),
                tag:    targetMember.user.tag
              }
            }
            this.props.image = {
              image: targetMember.displayAvatarURL({ size: Math.pow(2, 8) })
            }
          }
        }
        break
      default:
        targetMention = "Error"
        this.error = true
        this.props.description = `Invalid channel type ['${targetType}']`
        return false
    }

    if (!specs?.name || !specs.name || specs.name == "") {
      this.error = true
      this.props.description = targetType.ucfirst() + ` ` + targetId.inlinecode() + ` not found in *${guild.name}*`
      return false
    }

    // console.log(
    //   [
    //     `Output:   ${targetMention}`,
    //     ""
    //   ].join("\n")
    // )

    if(!this.error) {
      this.props.fields = []

      this.props.fields.push(
        [
          // Mention Type
          {
            name: "Type",
            value: targetType
          }
        ]
      )

      this.props.fields.push(
        [
          // Name
          {
            name: "Name",
            value: specs?.url ? `[${specs?.name?.inlinecode()}](${specs?.url})` : specs?.name?.codeblock()
          },
          // Mention ID
          {
            name: "ID",
            value: targetId.codeblock()
          },
          // Animated Emoji
          {
            name: "Animated?",
            value: specs?.animated
          }
        ]
      )

      this.props.fields.push(
        [
          // Topic
          {
            name: "Topic",
            value: specs?.topic?.codeblock()
          },
          // Roles
          {
            name: `Roles [${specs?.roles?.length}${specs?.highest}]`,
            value: specs?.roles?.join(", ").codeblock()
          }
        ]
      )

      this.props.fields.push(
        [
          // Subtype
          {
            name: "Subtype",
            value: specs?.subtype?.codeblock()
          },
          // Position
          {
            name: "Position",
            value: specs?.position?.codeblock()
          },
          // Hoisted
          {
            name: "Hoisted?",
            value: (targetType == "role") ?
              (
                specs?.hoisted ?
                this.profile.emojis.check :
                this.profile.emojis.nocheck
              )
              : ""
          }
        ]
      )

      this.props.fields.push(
        [
          // Creation Time
          {
            name: "Creation Time",
            value: specs?.creationStr
          }
        ]
      )

      this.props.fields.push(
        [
          // Joined Time
          {
            name: "Joined Time",
            value: specs?.joinedStr
          }
        ]
      )

      this.props.fields.push(
        [
          // Mention Link
          {
            name: "Mention",
            value: targetMention
          },
          // Mention Raw Code
          {
            name: "Code",
            value: targetMention.codeblock()
          }
        ]
      )

      this.props.fields.push(
        [
          // Extra
          {
            name: "Extra",
            value: specs?.extra
          }
        ]
      )
    }

    return !this.error
  }
}
