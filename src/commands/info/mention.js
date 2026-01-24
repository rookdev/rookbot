// @ts-nocheck

/**
 * Discord Stuff
 *  Command Option Types
 *  Channel Types
 *  Guild Emoji
 *  Formatters
 *   codeBlock
 *   inlineCode
 *   italic
 *   roleMention
 *   userMention
 */
const {
  ApplicationCommandOptionType,
  ChannelType,
  GuildEmoji,
  codeBlock,
  inlineCode,
  italic,
  roleMention,
  userMention
} = require('discord.js')
// Base Rook Command
const { RookCommand } = require('../../classes/command/rcommand.class')
const fileFuncs = require('../../utils/fs/fileFuncs')
const timeFormat = require('../../utils/formatters/timeFormat')
const moment = require('moment')

module.exports = class MentionCommand extends RookCommand {
  constructor(client) {
    let comprops = {
      name: "mention",
      category: "info",
      description: "Give code to post a mention in chat",
      flags: { target: "required" },
      options: [
        {
          name: "target-id",
          description: "Generic Target ID",
          type: ApplicationCommandOptionType.String
        },
        {
          name: "mention-id",
          description: "Mention ID (Role/User)",
          type: ApplicationCommandOptionType.Mentionable
        },
        {
          name: "channel-id",
          description: "Channel ID",
          type: ApplicationCommandOptionType.Channel
        },
        {
          name: "emoji-id",
          description: "Emoji ID",
          type: ApplicationCommandOptionType.String
        },
        {
          name: "target-type",
          description: "Target Type",
          type: ApplicationCommandOptionType.String,
          choices: [
            {
              name: "User",
              value: "user"
            },
            {
              name: "Channel",
              value: "channel"
            },
            {
              name: "Emoji",
              value: "emoji"
            },
            {
              name: "Role",
              value: "role"
            }
          ]
        }
      ],
      testOptions: [
        { "channel-id": "<#1312729342731751487>" },           // #bot-console
        { "emoji-id":   "<:akariwuv:1462522448065986680>" },  // :akariwuv:
        { "mention-id": "<@&1303864581873205289>" },          // @Admin
        { "mention-id": "<@!263968998645956608>" },           // @Minnie
        { "mention-id": "<@!211926100681424906>" },           // @Nik
        { "mention-id": "<@!1307416505171968011>" },          // @minrook
        { "channel-id": "<#!1303864272832565272>" },          // Voice:VC 1

        { "target-id": "<#1312729342731751487>" },           // #bot-console
        { "target-id": "<:akariwuv:1462522448065986680>" },  // :akariwuv:
        { "target-id": "<@&1303864581873205289>" },          // @Admin
        { "target-id": "<@!263968998645956608>" },           // @Minnie
        { "target-id": "<@!211926100681424906>" },           // @Nik
        { "target-id": "<@!1307416505171968011>" },          // @minrook
        { "target-id": "<#!1303864272832565272>" },          // Voice:VC 1

        { "target-id": "1312729342731751487", "target-type": "channel" }, // #bot-console
        { "target-id": "1462522448065986680", "target-type": "emoji" },   // :akariwuv:
        { "target-id": "1303864581873205289", "target-type": "role" },    // @Admin
        { "target-id": "263968998645956608",  "target-type": "user" },    // @Minnie
        { "target-id": "211926100681424906",  "target-type": "user" },    // @Nik
        { "target-id": "1307416505171968011", "target-type": "user" },    // @minrook
        { "target-id": "1303864272832565272", "target-type": "channel" }  // Voice:VC 1

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
    let targetInput   = ""
    // Get Target Type
    let targetType    = coptions["target-type"] ?? "channel"
    let targetMember  = null
    let targetMention = ""

    for (let check of 
      [
        "mention",
        "channel",
        "emoji",
        "target"
      ]
    ) {
      if (coptions[`${check}-id`]) {
        targetInput = coptions[`${check}-id`]
      }
    }
    // Get Target ID
    let targetId = targetInput.replace(/[<#@&!>]/g, '')  // Remove <@>, <@!>, and >

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
    if (coptions["emoji-id"] && coptions["emoji-id"] != "") {
      targetType = "emoji"
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
    this.props.description = []

    let specs = {}

    // Get Guild
    let guild = await this.getCache(client, client, "guilds", interaction?.guild?.id)

    switch(targetType) {
      // Channel
      case "channel":
        targetMention = `<#${targetId}>`
        if (guild) {
          let channel = null
          try {
            channel = await this.getCache(client, guild, "channels", targetId)
          } catch (error) {
            this.error = true
            this.props.description = `Channel ${inlineCode(targetId)} not found in ${italic(guild.name)}`
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
            if (specs.subtype == "GuildCategory") {
              this.props.description.push("Channels".boldUnderline())
              for (let [cID, thisChannel] of await channel.children.cache) {
                this.props.description.push(
                  (thisChannel.permissionsLocked ? this.profile.emojis.check : this.profile.emojis.nocheck) +
                  inlineCode(thisChannel.name)
                )
              }
            }
            if (channel?.parent?.name) {
              specs.parent = {
                name: channel.parent.name,
                id: channel.parent.id
              }
            }
            if (channel?.permissionsLocked) {
              specs.synced = true
            }
            if (specs.extra) {
              specs.extra = codeBlock(specs.extra)
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
              case "GuildCategory":
                avatar = "https://em-content.zobj.net/source/twitter/408/file-folder_1f4c1.png"
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
            emoji = await this.getCache(client, guild, "emojis", targetId)
          } catch (error) {
            this.error = true
            this.props.description = `Emoji ${inlineCode(targetId)} not found in ${italic(guild.name)}`
            return false
          }
          if (emoji) {
            if (!emoji?.name) {
              break
            }
            specs = {
              name: emoji?.name,
              url: emoji?.imageURL({ size: 128 }),
              animated: emoji?.animated ?
                (
                  emoji.animated ?
                  this.profile.emojis.check :
                  this.profile.emojis.nocheck
                )
                : this.profile.emojis.nocheck
            }
            targetMention = `<:${specs.name}:${targetId}>`
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
        targetMention = roleMention(targetId)
        if (guild) {
          let role = await this.getCache(client, guild, "roles", targetId)
          if (role) {
            if (!role?.name) {
              break
            }
            specs = {
              name: role?.name,
              url: role?.iconURL({ size: 128 }),
              hoisted: role?.hoist ?
                (
                  role.hoist ?
                  this.profile.emojis.check :
                  this.profile.emojis.nocheck
                ) :
                this.profile.emojis.nocheck,
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
        targetMention = userMention(targetId)
        if (guild) {
          // Get Guild Member
          try {
            targetMember = await this.getCache(client, guild, "members", targetId)
          } catch(err) {
            // console.log(err)
          }
          if (targetMember) {
            if (!targetMember?.user) {
              break
            }
            specs = {
              name: targetMember.user.tag
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
            specs.roleIcon = await targetMember.roles.icon?.iconURL({ size: 128 })
            specs.guildTag = targetMember?.user?.primaryGuild
            // https://cdn.discordapp.com/guild-tag-badges/<guild_id>/<badge_hash>.png

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

            if (targetMember?.presence?.status) {
              specs.status = targetMember.presence.status != "offline"
            }

            let pretty_name = "Message_Stamp".split("_").map(x => x.ucfirst()).join(" ")
            let logFilePath = fileFuncs.getAPath(
              [
                "src",
                "botlogs"
              ],
              ((this.DEV ? "DEV" : "") + "member" + pretty_name.replace(" ", "") + "s.log")
            )
            let pad = 20
            let userIDStr = `U:${targetId.padEnd(pad)}` + `;`
            let guildIDStr = `G:${guild.name}:[${guild.id}]`
            let entries = fileFuncs.getAFile(logFilePath)
            if (entries) {
              // console.log("We've got entries!")
              if (entries.includes(userIDStr + guildIDStr)) {
                // console.log("We've got a user!")
                let userIdx = entries.indexOf(userIDStr + guildIDStr)
                if (userIdx) {
                  // console.log(`First instance is at: ${userIdx}`)
                  let recordNumber = -1
                  recordNumber = Math.ceil(userIdx / 192)
                  if (recordNumber > 0) {
                    recordNumber -= 1
                    // console.log(`User is at: ${recordNumber}!`)
                    entries = entries.split("\n")
                    let record = entries[recordNumber]

                    specs.online = false
                    if (targetMember?.presence?.status) {
                      specs.online = targetMember.presence.status != "offline"
                      switch(targetMember.presence.status) {
                        case "invisible":
                          this.props.color = "#808080"
                          break
                        case "idle":
                          this.props.color = "#ffaf00"
                          break
                        case "dnd":
                          this.props.color = "#ff0000"
                          break
                        case "online":
                          this.props.color = "#00ff00"
                          break
                        default:
                          this.props.color = "#000000"
                          break
                      }
                    }
                    specs.seenStr = specs.online ? "🟩ONLINE🟩" : "SEEN"
                    let seenTime  = record.match(/T\:([^;]+)/)
                    let seenChan  = record.match(/C\:([\d]+)/)
                    let seenMsg   = record.match(/M\:([\d]+)/)

                    if (!specs.online || true) {
                      if (seenTime) {
                        // console.log(seenTime)
                        specs.seenStr = timeFormat(moment.utc(seenTime[1]), { with: "relative" })
                      }
                    }
                    if (seenChan) {
                      if (seenMsg) {
                        specs.seenChan = `https://discord.com/channels/${guild.id}/${seenChan[1]}`
                        specs.seenMsg = `${specs.seenChan}/${seenMsg[1]}`
                      }
                    }
                  }
                }
              }
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
                avatar: specs?.roleIcon ?? targetMember.displayAvatarURL({ size: 128 }),
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
      this.props.description = `${targetType.ucfirst()} ${inlineCode(targetId)} not found in ${italic(guild.name)}`
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
            value: specs?.url ? `[${inlineCode(specs?.name)}](${specs?.url})` : codeBlock(specs?.name)
          },
          // Mention ID
          {
            name: "ID",
            value: codeBlock(targetId)
          },
          // Animated Emoji
          {
            name: "Animated?",
            value: specs?.animated ? specs.animated : ""
          }
        ]
      )

      this.props.fields.push(
        [
          //
          {
            name: "Guild Tag",
            value: specs?.guildTag?.tag
          },
          {
            name: "Guild Badge",
            value: specs?.guildTag?.badge
          },
          // Parent Name
          {
            name: "Parent Name",
            value: specs?.parent?.name
          },
          // Parent ID
          {
            name: "Parent ID",
            value: specs?.parent?.id ? codeBlock(specs.parent.id) : ""
          }
        ]
      )

      this.props.fields.push(
        [
          // Topic
          {
            name: "Topic",
            value: specs?.topic ? codeBlock(specs?.topic) : ""
          },
          // Roles
          {
            name: `Roles [${specs?.roles?.length}${specs?.highest}]`,
            value: specs?.roles?.length && (specs.roles.length > 0) ? codeBlock(specs?.roles?.join(", ")) : ""
          }
        ]
      )

      this.props.fields.push(
        [
          // Subtype
          {
            name: "Subtype",
            value: specs?.subtype ? codeBlock(specs?.subtype) : ""
          },
          // Position
          {
            name: "Position",
            value: specs?.position ? codeBlock(specs?.position) : ""
          },
          // Synced?
          {
            name: "Synced",
            value: (targetType == "channel") ?
              (
                specs?.synced ?
                (
                  specs.synced ?
                  this.profile.emojis.check :
                  this.profile.emojis.nocheck
                )
                : ""
              )
              : ""
          },
          // Hoisted
          {
            name: "Hoisted?",
            value: (targetType == "role") ?
              (
                specs?.hoisted ?
                (
                  specs.hoisted ?
                  this.profile.emojis.check :
                  this.profile.emojis.nocheck
                )
                : ""
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

      if (specs?.seenStr) {
        this.props.fields.push(
          [
            // Seen Time
            {
              name: "Last Seen Active",
              value: specs?.seenStr
            }
          ],
          [
            // Seen In
            {
              name: "Last Seen In",
              value: specs?.seenChan
            },
            // Seen Saying
            {
              name: "Last Seen Saying",
              value: specs?.seenMsg
            }
          ]
        )
      }

      if (targetType == "user" && targetMember) {
        this.props.fields.push(
          [
            // Bot Actions
            {
              name: "Bot User?",
              value: targetMember.user.bot ? "🤖" : "🟥"
            },
            {
              name: "Can Bot Edit?",
              value: await this.botCanEdit(client, targetMember, true) ? "🛠" : "🟥"
            },
            {
              name: "Can Bot Moderate?",
              value: await this.botCanMod(client, targetMember, true) ? "🔨" : "🟥"
            }
          ]
        )
      }

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
            value: codeBlock(targetMention)
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
