// @ts-nocheck

/**
 * Discord
 *  Command Option Types
 *  Permission Flags
 *  Message Flags
 *  Webhook
 *  Formatters
 *   inlineCode
 *   italic
 */
const {
  ApplicationCommandOptionType,
  DiscordjsErrorCodes,
  PermissionFlagsBits,
  MessageFlags,
  Webhook,
  inlineCode,
  italic,
  MessagePayload
} = require('discord.js')
// ModCommand
const { ModCommand } = require('../../classes/command/modcommand.class')
// Base Rook Embed
const { RookEmbed } = require('../../classes/embed/rembed.class')
const mentionFuncs = require('../../utils/formatters/mentions')
// Use Discord HammerTime
const timeFormat = require('../../utils/formatters/timeFormat')
const fileFuncs = require('../../utils/fs/fileFuncs')
const numFuncs = require('../../utils/primitives/numFuncs')
const dbFuncs = require('../../utils/db/dbFuncs')
const getters = require('../../utils/guild/getters')
const moment = require('moment')
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms))
const fs = require('fs')      // Filesystem manipulation

/**
 * @class
 * @classdesc Speak as Bot
 * @this {SayCommand}
 * @extends {ModCommand}
 * @public
 */
module.exports = class SayCommand extends ModCommand {
  constructor(client) {
    let comprops = {
      name: "say",
      description: "Say as Bot",
      category: "botdo",
      options: [
        {
          name: "message",
          description: "Message to send",
          type: ApplicationCommandOptionType.String
        },
        {
          name: "channel",
          description: "Channel to send message to",
          type: ApplicationCommandOptionType.Channel
        },
        {
          name: "destination-message",
          description: "Destination Message URL",
          type: ApplicationCommandOptionType.String
        },
        {
          name: "source-message",
          description: "Source Message URL",
          type: ApplicationCommandOptionType.String
        },
        {
          name: "attachment-message",
          description: "Upload a JSON file with an embed",
          type: ApplicationCommandOptionType.Attachment
        },
        {
          name: "visage-name",
          description: "Visage to post as",
          type: ApplicationCommandOptionType.String
        }
      ],
      testOptions: [
        { message: "Send to current channel" },
        { message: "Send to #bot-console", channel: "#bot-console" },
        { message: "Send to #rook-console", channel: "#rook-console" },
        { message: "Say as Brad", "visage-name": "brad" }
      ],
      userPermissions: [ PermissionFlagsBits.ManageMessages ],
      botPermissions: [ PermissionFlagsBits.SendMessages ]
    }
    let props = {}
    super(
      client,
      {...comprops},
      {...props}
    )
  }

  async buildPayload(destChannel, message, attachment) {
    let payload = {}

    if (typeof message === "object") {
      // this.messages.push(message)
      for (let property of ["content","embeds","poll","files"]) {
        if (message[property]) {
          payload[property] = message[property]
        }
      }
    } else if (typeof message === "string") {
      payload = message
    }

    if (!payload && attachment) {
      let attachmentRes = await fetch(attachment.attachment)
      let attachmentJSON = await attachmentRes.json()
      payload = await new MessagePayload(
        destChannel,
        attachmentJSON
      )
    }

    return payload
  }

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

  async getRookhook(interaction) {
    // Get Guild Metadata
    // DB
    let dbRes = await dbFuncs.getDB(
      interaction.guild.id,
      "meta"
    )
    let guildMetadata = dbRes[0]
    this.messages.push(dbRes[1])
    // /DB

    let rookhook = null // Bucket for rookhook
    let rookhookID = 0  // Bucket for rookhook ID
    let webhooks = null // Bucket for Guild Webhooks

    if (!interaction?.guild) {
      this.error = true
      this.props.description = "Needs to be run in a Guild"
      return false
    }

    // Get Guild Webhooks
    webhooks = await interaction.guild.fetchWebhooks()
    if (!webhooks) {
      this.error = true
      this.props.description = `Couldn't load webhooks for ${mentionFuncs.guildMention(interaction.guild.name, interaction.guild.id, { showID: true, oneLine: true })}`
      return false
    }

    if (guildMetadata) {
      // Get rookhookID if defined
      if (guildMetadata?.rookhook) {
        rookhookID = guildMetadata.rookhook
      }
    }

    // If we didn't receive the ID, try to search for it by name
    if (rookhookID == 0) {
      rookhook = webhooks.find(
        w => w.name == "rookbot impersonator"
      )
    } else {
      // Otherwise, we've got the ID, grab it
      rookhook = webhooks.find(
        w => w.id === rookhookID
      )
    }

    if (!rookhook) {
      try {
        await interaction.channel.createWebhook(
          {
            name: "rookbot impersonator",
            avatar: "https://github.com/rookdev/rookbot/blob/oop-commands/src/res/media/rookbotIcon.png?raw=true"
          }
        )
        webhooks = await interaction.guild.fetchWebhooks()
        rookhook = webhooks.find(
          w => w.name == "rookbot impersonator"
        )
      } catch (e) {
        this.error = true
        this.props.description = `rookhook not found and not creatable for ${mentionFuncs.guildMention(interaction.guild.name, interaction.guild.id, { showID: true, oneLine: true })}`
        return false
      }
    }

    return rookhook
  }

  async setVisage(interaction, visage, channel) {
    // this.messages.push("We're selecting a visage!")
    let rookhook = await this.getRookhook(interaction)
    let visages = null  // Bucket for visages

    if (!interaction?.guild) {
      this.error = true
      this.props.description = "Needs to be run in a Guild"
      return false
    }

    if (!rookhook) {
      this.error = true
      this.props.description = `rookhook not found for ${mentionFuncs.guildMention(interaction.guild.name, interaction.guild.id, { showID: true, oneLine: true })}`
      return false
    }

    if (visage == "guild") {
      visages = {
        "guild": {
          name: interaction.guild.name,
          avatar: await interaction.guild.iconURL({ size: 128 })
        },
        "reset": {
          name: "rookbot impersonator",
          avatar: "https://github.com/rookdev/rookbot/blob/oop-commands/src/res/media/rookbotIcon.png?raw=true"
        }
      }
    } else {
      let dbRes = await dbFuncs.getDB(
        interaction.guild.id,
        "visages"
      )
      visages = dbRes[0]
      this.messages.push(...dbRes[1])
    }

    if (!visages) {
      this.error = true
      this.props.description = "Visages not found"
      return false
    }

    if (!visages[visage]) {
      this.error = true
      this.props.description = `Selected visage (${inlineCode(visage)}) not found`
      return false
    }

    if (rookhook.name !== visages[visage].name) {
      let rookhookEdit = await rookhook.edit(
        {
          name: visages[visage].name,
          avatar: visages[visage].avatar,
          channel: channel
        }
      )

      if (!rookhookEdit) {
        this.error = true
        this.props.description = `Couldn't edit rookhook [${inlineCode(webhookID)}]`
        return false
      }

      // Wait a second after editing the webhook
      await wait(1 * 1000)
    }
    // this.messages.push("We've selected a visage!")
    return [rookhook, visages]
  }

  async action(client, interaction, coptions={}, independent=false) {
    // Get Channel
    let channel = coptions["channel"] ?? interaction.channel
    // Get Message
    let message = coptions["message"] ?? ""
    // Get Action Mode
    let mode = coptions["mode"] ?? "say"
    // Get Dest Message
    let destMessageURL = coptions["destination-message"] ?? null
    // Get Src Message
    let sourceMessageURL = coptions["source-message"] ?? null
    // Get Attachment Data
    let attachment = interaction.options.getAttachment("attachment-message") ?? null
    // Get Visage
    let visage = coptions["visage-name"] ?? null
    let visages = null

    let rookhook = null     // Bucket for rookhook webhook
    let srcMessage = null   // Bucket for source message
    let destMessage = null  // Bucket for destination message

    let messages = []

    // If only 'message'
    //  Say, Edit, Clone
    // If source-message
    //  Edit, Clone
    // If destination-message
    //  Edit, Clone
    // If no source-message
    //  Say, Edit
    // If no destination-message
    //  Say
    // If source-message && destination-message
    //  Edit, Clone

    if (typeof channel === "string") {
      channel = channel.replace(/[<#@&!>]/g, '')
      // Calculate channel
      channel = await this.getCache(client, interaction.guild, "channels", channel)
    }

    if (!channel) {
      this.error = true
      this.props.description = `Couldn't load Channel`
      return false
    }

    // Bot doesn't have perms SendMessages in channel
    if (
      !channel
      .permissionsFor(client.user)
      .has(PermissionFlagsBits.SendMessages)
    ) {
      this.error = true
      this.props.description = `Bot doesn't have ${inlineCode('SendMessages')} for ${channel}`
      return false
    }

    // User doesn't have perms ManageMessages in channel
    if (
      !channel
      .permissionsFor(interaction.user)
      .has(PermissionFlagsBits.ManageMessages)
    ) {
      this.error = true
      this.props.description = `User doesn't have ${inlineCode('ManageMessages')} for ${channel}`
      return false
    }

    // this.messages.push("We've got a valid channel!")

    // If we're using a visage
    if (visage) {
      let visageRes = await this.setVisage(interaction, visage, channel)
      rookhook = visageRes[0]
      visages = visageRes[1]
    }

    // Result
    let result = null

    // No Message
    if ((message == "") && !sourceMessageURL && !attachment) {
      // this.messages.push("No message sent!")
      this.error = true
      this.props.description = "No message content sent"
      return false
    }
    // Message too long
    if (message.length > 1024) {
      // this.messages.push("Message too long!")
      this.error = true
      this.props.description = `Message too long [${message.length}]`
      return false
    }

    if (["say","edit"].indexOf(mode) > -1) {
      // Say/Edit Mode
      // this.messages.push(`${mode.ucfirst()}: Startup!`)

      // Source Checks
      if (["clone"].indexOf(mode) > -1) {
        // No Source Message
        if (!sourceMessageURL) {
          this.error = true
          this.props.description = `${mode.ucfirst()} Mode: No Source Message sent`
          return false
        }
      }

      if (sourceMessageURL) {
        srcMessage = await this.getMessage(client, sourceMessageURL)
        // Source Message not found
        if (!srcMessage) {
          this.error = true
          this.props.description = `${mode.ucfirst()} Mode: Couldn't load Source Message ID '${sourceMessageURL}'`
          return false
        }
      }

      if (sourceMessageURL || destMessageURL) {
        mode = "edit"
        if (!destMessageURL) {
          mode = "clone"
        }
      } else {
        mode = "say"
      }
      // this.messages.push(`${mode.ucfirst()}: Detected`)

      // Destination Checks
      if (["edit","clone"].indexOf(mode) > -1) {
        // No Destination Message
        if (!destMessageURL && (mode == "edit")) {
          this.error = true
          this.props.description = `${mode.ucfirst()} Mode: No Destination Message sent`
          return false
        }

        destMessage = await this.getMessage(client, destMessageURL)
        // Destination Message not found
        if (!destMessage && (mode == "edit")) {
          this.error = true
          this.props.description = `${mode.ucfirst()} Mode: Couldn't load Destination Message ID '${destMessageURL}'`
          return false
        }

        if (destMessage) {
          let notPostedByClientError = (!rookhook) && (destMessage.author.id !== client.user.id)
          let notPostedByHookError = (rookhook) && (false)

          // Message not posted by client user
          if (notPostedByClientError) {
            this.error = true
            this.props.description = [
              `Destination Message not editable by ${interaction.guild.members.me}`,
              `Posted by ${mentionFuncs.userMention(destMessage.author.id, { showID: true, oneLine: true })}`,
              destMessageURL
            ]
            rookhook = await this.getRookhook(interaction)
            if (rookhook && destMessage.author.id == rookhook.id) {
              visage = true
            } else {
              return false
            }
          }

          // Message not posted by rookhook
          if (notPostedByHookError) {
            this.error = true
            this.props.description = `Destination Message not editable by rookhook`
            return false
          }
        }
      }

      // If rookhook, use hook
      if (visage && rookhook) {
        // this.messages.push(`${mode.ucfirst()}: rookhook - ${visage}`)
        channel = rookhook.channel
      } else {
        this.messages.push(`${mode.ucfirst()}: Message`)
      }

      let this_package = {
        content:  "** **",
        embeds:   srcMessage?.embeds  ?? [],
        poll:     srcMessage?.poll    ?? null,
        files:    srcMessage?.attachments?.toJSON() ?? []
      }
      if (srcMessage?.content) {
        if (srcMessage.content.trim() != "") {
          this_package.content = srcMessage.content
        }
      }
      if (message && message != "") {
        this_package = message
      }
      // this.messages.push(`Message: [${JSON.stringify(this_package)}]`)

      message = await this.buildPayload(
        channel,
        this_package,
        attachment
      )

      if (srcMessage || destMessage) {
        mode = "edit"
        if (!destMessage) {
          mode = "clone"
        }
      } else {
        mode = "say"
      }
      // this.messages.push(`${mode.ucfirst()}: Decided`)

      if (visage && rookhook) {
        // Use Rookhook
        switch(mode) {
          case "say":
          case "clone":
            destMessage = await rookhook.send(message)
            result = destMessage
            break
          case "edit":
            result = await rookhook.editMessage(destMessage, message)
            break
        }
      } else {
        // Use Bot
        switch(mode) {
          case "say":
          case "clone":
            destMessage = await channel.send(message)
            result = destMessage
            break
          case "edit":
            result = await destMessage.edit(message)
            break
        }
      }
      if (srcMessage?.reactions) {
        // this.messages.push("Source Message has reactions!")
        for (let [emojiName, reaction] of srcMessage.reactions.cache) {
          let emoji = await this.getCache(client, srcMessage.guild, "emojis", emojiName)
          if (!emoji) {
            emoji = emojiName
          }
          // this.messages.push(emoji)
          let reacted = await destMessage?.reactions?.resolve(emoji)?.me
          if (!reacted) {
            await destMessage.react(emoji)
          }
        }
      }
    }

    if (visages) {
      if (rookhook) {
        let rookhookEdit = await rookhook.edit(
          {
            name: visages.reset.name,
            avatar: visages.reset.avatar
          }
        )

        if (!rookhookEdit) {
          // this.messages.push("Couldn't reset rookhook!")
        }
      }
    }

    if (channel && (message != "")) {
      let props = {}
      let embeds = {}

      /**
       * Region that this is being sent to
       *  Development
       *  Production; also sends to Discord Audit Log
       */
      let region = ((!this.DEV) ? "Production" : "Development")

      // Get the posted time
      let resultDateTime = moment.utc(result.createdTimestamp)
      props.mod = {
        fields: [
          [
            // Posted Time
            {
              name: "Time",
              value: timeFormat(resultDateTime.format("x"), { with: "relative" })
            }
          ],
          [
            // Whodunnit?
            {
              name: "User",
              value: mentionFuncs.userMention(interaction.user.id, { showID: true })
            }
          ],
          [
            // Mode
            {
              name: "Mode",
              value: mode.ucfirst()
            }
          ],
          [
            // Visage
            {
              name: "Visage",
              value: visage
            }
          ],
          [
            // Sent in what Guild?
            {
              name: "Guild",
              value: mentionFuncs.guildMention(interaction.guild.name, interaction.guild.id, { showID: true })
            },
            // Sent to what Channel?
            {
              name: "Channel",
              value: mentionFuncs.channelMention(result.channel.id, { showID: true })
            }
          ],
          [
            // Message Link
            {
              name: "Message",
              value: mentionFuncs.messageMention(result.url, { showID: true })
            }
          ],
          [
            // Message Content
            {
              name: "Content",
              value: typeof message == "string" ? message.slice(0,1024) : ""
            }
          ],
          [
            // Region
            {
              name: "Region",
              value: region
            }
          ]
        ]
      }
      if (visage && visages && visages[visage]) {
        props.mod.playerTypes = {
          user: "user",
          target: "target"
        }
        props.mod.players = {
          user: {
            name: interaction.user.displayName,
            avatar: await interaction.user.displayAvatarURL({ size: 128 })
          },
          target: {
            name: visages[visage].name,
            avatar: visages[visage].avatar
          }
        }
      }

      // Edit reply to Mod
      embeds.mod = new RookEmbed(client, props.mod)
      if (typeof interaction.editReply === "function") {
        try {
          await interaction.editReply({ embeds: [ embeds.mod ] })
        } catch(err) {
          if (`${err}`.includes("InteractionNotReplied")) {
            // do nothing
          } else {
            this.messages.push(err.stack)
          }
        }
      }

      // Save the ghost message to a log file
      const logFilePath = fileFuncs.getAPath(
        [
          "src",
          "botlogs"
        ],
        `${this.DEV ? 'DEV' : ''}ghostMessages.log`
      )
      let logEntry = [
        `[${moment.utc().toISOString()}]`,
        `Author:      ${interaction.user.tag} (ID: ${interaction.user.id})`,
        `Mode:        ${mode.ucfirst()}`,
        `Visage:      ${visage}`,
        `Guild:       ${result.guild.name} (ID: ${result.guild.id})`,
        `Channel:     #${result.channel.name} (ID: ${result.channel.id})`,
        `Message ID:  ${result.id}`,
        `Region:      ${region}`,
        `Content:     ${message}`,
        '--------------------------------'
      ]

      // Append the log entry to the file
      fs.appendFileSync(logFilePath, logEntry.join("\n") + "\n", "utf8")

      let logsChannel = await this.getChannel(client, interaction, "logging-say")
      if (logsChannel) {
        logsChannel.send({ embeds: [ embeds.mod ] })
      }
    }

    this.null = true

    return true
  }
}
