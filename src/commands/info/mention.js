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
const mentionFuncs = require('../../utils/formatters/mentions')
const globalFuncs = require('../../utils/primitives/globalFuncs')
const timeFormat = require('../../utils/formatters/timeFormat')
const fileFuncs = require('../../utils/fs/fileFuncs')
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
          name: "message-url",
          description: "Message URL",
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

  async getMessage(client=null, messageURL="") {
    let message = null

    if (!client) {
      // this.messages.push("No client sent")
      return false
    }

    if (!messageURL || (messageURL == "")) {
      // this.messages.push("No message URL sent")
      return false
    }

    let matches = messageURL.match(/^(?:[\D]+)([\d]+)(?:[/])([\d]+)(?:[/])([\d]+)(?:[/]?)$/)
    // Couldn't identify message
    if (!matches || (matches.length < 4)) {
      this.error = true
      this.props.description = `Couldn't identify message: '${messageURL}'`
      return false
    }

    // Try to locate message
    let [ _, guildID, channelID, messageID ] = matches

    const guild = await this.getCache(client, client, "guilds", guildID)
    // Guild not found
    if (!guild) {
      this.error = true
      this.props.description = `Couldn't load Guild ID '${guildID}'`
      return false
    }

    const channel = await this.getCache(client, guild, "channels", channelID)
    // Channel not found
    if (!channel) {
      this.error = true
      this.props.description = `Couldn't load Channel ID '${channelID}'`
      return false
    }

    message = await this.getCache(client, channel, "messages", messageID)
    // Message not found
    if (!message) {
      this.error = true
      this.props.description = `Couldn't load Message ID '${messageID}'`
      return false
    }

    return message
  }

  async action(client, interaction, coptions) {
    // Get Target Input
    let targetInput   = ""
    // Get Target Type
    let targetType    = coptions["target-type"] ?? "channel"
    let targetMember  = null
    let targetMention = ""
    let messageURL    = coptions["message-url"] ?? null

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

    // this.messages.push(
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

    if (messageURL) {
      targetType = "message"
    }

    // this.messages.push(
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
    let guild = await this.getGuild(client, interaction)

    switch(targetType) {
      // Channel
      case "channel":
        targetMention = mentionFuncs.channelMention(targetId)
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
            if (channel?.messages) {
              let numPins = 0
              if (typeof channel?.messages?.fetchPins === "function") {
                let fetchedPins = await channel.messages.fetchPins()
                numPins += fetchedPins.items.length
                while(fetchedPins.hasMore) {
                  fetchedPins = await channel.messages.fetchPins(
                    {
                      before: fetchedPins.items.at(-1).pinnedAt
                    }
                  )
                }
              }
              if (numPins) {
                specs.numPins = codeBlock(numPins)
              }
            }

            // Set Target to Channel
            let avatar = ""
            switch (specs?.subtype) {
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
            for (let [specialChannelType, specialChannelId] of Object.entries(
              {
                afk:            guild?.afkChannelId,
                publicUpdates:  guild?.publicUpdatesChannelId,
                rules:          guild?.rulesChannelId,
                safetyAlerts:   guild?.safetyAlertsChannelId,
                system:         guild?.systemChannelId,
                widget:         guild?.widgetChannelId
              }
            )) {
              if (specialChannelId && (specialChannelId == targetId)) {
                switch(specialChannelType) {
                  case "afk":
                    avatar = "https://em-content.zobj.net/source/twitter/408/sleeping-face_1f634.png"
                    specs.subtype += ", AFK"
                    break
                  case "publicUpdates":
                    avatar = "https://em-content.zobj.net/source/twitter/408/gear_2699-fe0f.png"
                    specs.subtype += ", Public Updates"
                    break
                  case "rules":
                    avatar = "https://em-content.zobj.net/source/twitter/408/memo_1f4dd.png"
                    specs.subtype += ", Rules"
                    break
                  case "safetyAlerts":
                    avatar = "https://em-content.zobj.net/source/twitter/408/safety-vest_1f9ba.png"
                    specs.subtype += ", Safety Alerts"
                    break
                  case "system":
                    avatar = "https://em-content.zobj.net/source/twitter/408/desktop-computer_1f5a5-fe0f.png"
                    specs.subtype += ", System"
                    break
                  case "widget":
                    avatar = "https://em-content.zobj.net/source/twitter/408/globe-with-meridians_1f310.png"
                    specs.subtype += ", Widget"
                    break
                }
              }
            }
            if (specs?.subtype) {
              if (specs.subtype.indexOf(", ") > -1) {
                specs.subtype = specs.subtype.split(", ").join("\n")
              }
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
              url: await emoji?.imageURL({ size: 128 }),
              animated: emoji?.animated ?
                (
                  emoji.animated ?
                  this.profile.emojis.check :
                  this.profile.emojis.nocheck
                )
                : this.profile.emojis.nocheck
            }
            targetMention = mentionFuncs.emojiMention(specs.name, targetId)
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
        targetMention = mentionFuncs.roleMention(targetId)
        if (guild) {
          let role = await this.getCache(client, guild, "roles", targetId)
          if (role) {
            if (!role?.name) {
              break
            }
            specs = {
              name: role?.name,
              url: await role?.iconURL({ size: 128 }),
              color: role?.colors ? 
                codeBlock(
                  Object.values(role.colors)
                    .filter(v => v)
                    .map(v => ("#" + v.toString(16).toUpperCase()))
                    .join(", ")
                ) :
                "",
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
                avatar: specs?.url ?? "https://em-content.zobj.net/source/twitter/408/busts-in-silhouette_1f465.png"
              }
            }
          }
        }
        break
      // User
      case "user":
        targetMention = mentionFuncs.userMention(targetId)
        if (guild) {
          // Get Guild Member
          try {
            targetMember = await this.getCache(client, guild, "members", targetId)
          } catch(err) {
            // this.messages.push(err)
          }
          if (targetMember) {
            if (!targetMember?.user) {
              break
            }
            specs = {}
            if (targetMember?.user?.tag) {
              specs.name = targetMember.user.tag
            } else if (targetMember?.user?.username) {
              specs.name = `${targetMember.user.username}#${targetMember.user.discriminator}`
            }
            const roles = await targetMember
              .roles
              .valueOf()
              .sort(
                (roleA, roleB) => roleB.position - roleA.position
              )
              .map(role=>role.name)
              .filter(roleName=>roleName != "@everyone")
            if (roles) {
              specs.roles = roles
            }

            specs.highest = await targetMember.roles.highest
            specs.roleIcon = await targetMember.roles.icon?.iconURL({ size: 128 })
            specs.clan = targetMember?.user?.primaryGuild

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

            let pretty_name = "Message_Stamp".split("_").map(x=>x.ucfirst()).join(" ")
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
              // this.messages.push("We've got entries!")
              if (entries.includes(userIDStr + guildIDStr)) {
                // this.messages.push("We've got a user!")
                let userIdx = entries.indexOf(userIDStr + guildIDStr)
                if (userIdx) {
                  // this.messages.push(`First instance is at: ${userIdx}`)
                  let recordNumber = -1
                  recordNumber = Math.ceil(userIdx / 192)
                  if (recordNumber > 0) {
                    recordNumber -= 1
                    // this.messages.push(`User is at: ${recordNumber}!`)
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
                        // this.messages.push(seenTime)
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
            let targetAvatar = ""
            let targetImage = ""
            if (globalFuncs.isStoat(client)) {
              targetAvatar = await targetMember.avatarURL
              targetImage = await targetMember.avatarURL
            } else {
              // "discord"
              targetAvatar = await targetMember.displayAvatarURL({ size: 128 })
              targetImage = await targetMember.displayAvatarURL({ size: 256 })
            }
            if (specs?.roleIcon) {
              targetAvatar = specs.roleIcon
            } else if (specs?.clan?.badge) {
              targetAvatar = await targetMember.user.guildTagBadgeURL({ size: 128 })
            }
            this.props.entities = {
              target: {
                type:   "target",
                id:     targetId,
                name:   targetMember.displayName,
                url:    "http://example.com/target",
                avatar: targetAvatar,
                tag:    targetMember.user.tag
              }
            }
            this.props.image = {
              image: targetImage
            }
          }
        }
        break
      // Message
      case "message":
        targetId = messageURL
        let message = await this.getMessage(client, messageURL)
        if (message) {
          targetMention = mentionFuncs.messageMention(message.url)
          targetId = guild.id + '/' + message.channel.id + '/' + message.id
          specs.name = "Message"

          if (message?.createdTimestamp) {
            specs.creationStr = timeFormat(message?.createdTimestamp, { with: "relative" })
          }
          specs.author = mentionFuncs.userMention(message.author.id, { showID: true })
          specs.guild = mentionFuncs.guildMention(guild.name, guild.id, { showID: true })
          specs.channel = mentionFuncs.channelMention(message.channel.id, { showID: true })

          this.props.playerTypes = {
            user: "target",
            target: "target"
          }

          this.props.entities = {
            target: {
              name: specs.name,
              avatar: "https://em-content.zobj.net/source/twitter/408/keycap-number-sign_23-fe0f-20e3.png"
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
      this.props.description = `${targetType.ucfirst()} ${inlineCode(targetId)} not found in ${italic(guild?.name)}`
      return false
    }

    // this.messages.push(
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
            value: specs?.clan?.tag ? codeBlock(specs?.clan?.tag) : ""
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
          // Color
          {
            name: "Color",
            value: specs?.color
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
          // Author
          {
            name: "Author",
            value: specs?.author
          }
        ]
      )
      this.props.fields.push(
        [
          // Guild
          {
            name: "Guild",
            value: specs?.guild
          },
          // Channel
          {
            name: "Channel",
            value: specs?.channel
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
            value: codeBlock(targetMention)
          }
        ]
      )

      this.props.fields.push(
        [
          // Pins
          {
            name: "Pins",
            value: specs?.numPins
          },
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
