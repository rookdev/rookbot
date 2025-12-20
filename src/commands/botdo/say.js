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
// Use Discord HammerTime
const timeFormat = require('../../utils/formatters/timeFormat')
const fileFuncs = require('../../utils/fs/fileFuncs')
const numFuncs = require('../../utils/primitives/numFuncs')
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
          name: "mode",
          description: "Mode for BotSpeak",
          type: ApplicationCommandOptionType.String,
          choices: [
            { name: "Say", value: "say" },
            { name: "Edit", value: "edit" },
            { name: "Clone", value: "clone" }
          ]
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
    let payload = null

    if (typeof message === "object") {
      console.log(message)
      for (let property of ["content","embeds","files"]) {
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
      // console.log("No client sent")
      return false
    }

    if (!messageURL || (messageURL == "")) {
      // console.log("No message URL sent")
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

    const guild = await client.guilds.fetch(guildID)
    // Guild not found
    if (!guild) {
      this.error = true
      this.props.description = `Couldn't load Guild ID '${guildID}'`
      return false
    }

    const channel = await guild.channels.fetch(channelID)
    // Channel not found
    if (!channel) {
      this.error = true
      this.props.description = `Couldn't load Channel ID '${channelID}'`
      return false
    }

    message = await channel.messages.fetch(messageID)
    // Message not found
    if (!message) {
      this.error = true
      this.props.description = `Couldn't load Message ID '${messageID}'`
      return false
    }
    if (message.partial) {
      message = await message.fetch()
    }

    return message
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

    let rookhook = null // Bucket for rookhook webhook

    if (typeof channel === "string") {
      channel = channel.replace(/[<#@&!>]/g, '')
    }

    // Calculate channel
    if (numFuncs.myIsNumeric(channel)) {
      if (["number", "string"].includes(typeof channel)) {
        channel = await interaction.guild.channels.fetch(channel)
      }
    } else {
      channel = await interaction.guild.channels.cache.find(
        c => c.name === channel
      )
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

    // console.log("We've got a valid channel!")

    // If we're using a visage
    if (visage) {
      // console.log("We're selecting a visage!")
      // Get Guild Metadata
      let guildMetadata = fileFuncs.getAFile(
        [
          "src",
          "dbs",
          interaction?.guild?.id
        ],
        "meta.json"
      )
      let rookhookID = 0        // Bucket for rookhook ID
      let webhooks = null       // Bucket for Guild Webhooks

      if (!interaction?.guild) {
        this.error = true
        this.props.description = "Needs to be run in a Guild"
        return false
      }

      // Get Guild Webhooks
      webhooks = await interaction.guild.fetchWebhooks()
      if (!webhooks) {
        this.error = true
        this.props.description = `Couldn't load webhooks for ${italic(interaction.guild.name)} [${inlineCode(interaction.guild.id)}]`
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
        this.error = true
        this.props.description = `rookhook not found for ${italic(interaction.guild.name)} [${inlineCode(interaction.guild.id)}]`
        return false
      }

      visages = fileFuncs.getAFile(
        [
          "src",
          "dbs",
          interaction.guild.id
        ],
        "visages.json"
      )

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
      // console.log("We've selected a visage!")
    }

    // Result
    let result = null

    // No Message
    if ((message == "") && !sourceMessageURL && !attachment) {
      // console.log("No message sent!")
      this.error = true
      this.props.description = "No message content sent"
      return false
    }
    // Message too long
    if (message.length > 1024) {
      // console.log("Message too long!")
      this.error = true
      this.props.description = `Message too long [${message.length}]`
      return false
    }

    // Say Mode
    if (mode == "say") {
      // console.log(`${mode.ucfirst()}: Startup!`)
      // If rookhook, use hook
      if (rookhook) {
        // console.log(`${mode.ucfirst()}: rookhook`)
        message = await this.buildPayload(
          rookhook.channel,
          message,
          attachment
        )
        result = await rookhook.send(message)
      } else {
        // Else, use bot
        // console.log(`${mode.ucfirst()}: Message`)
        message = await this.buildPayload(
          channel,
          message,
          attachment
        )
        result = await channel.send(message)
      }
    } else if (mode == "edit") {
      // console.log(`${mode.ucfirst()}: Startup!`)
      // Edit Mode
      // No Destination Message
      if (!destMessageURL) {
        this.error = true
        this.props.description = `${mode.ucfirst()} Mode: No Destination Message sent`
        return false
      }

      const destMessage = await this.getMessage(client, destMessageURL)
      // Destination Message not found
      if (!destMessage) {
        this.error = true
        this.props.description = `${mode.ucfirst()} Mode: Couldn't load Destination Message ID '${destMessageURL}'`
        return false
      }

      let notPostedByClientError = (!rookhook) && (destMessage.author.id !== client.user.id)
      let notPostedByHookError = (rookhook) && (false)

      // Message not posted by client user
      if (notPostedByClientError) {
        this.error = true
        this.props.description = [
          `Destination Message not editable by ${interaction.guild.members.me}`,
          destMessageURL
        ]
        return false
      }

      // Message not posted by rookhook
      if (notPostedByHookError) {
        this.error = true
        this.props.description = `Destination Message not editable by rookhook`
        return false
      }

      // If rookhook, use hook
      if (rookhook) {
        // console.log(`${mode.ucfirst()}: rookhook`)
        message = await this.buildPayload(
          rookhook.channel,
          message,
          attachment
        )
        result = await rookhook.editMessage(destMessage, message)
      } else {
        // Else, use bot
        // console.log(`${mode.ucfirst()}: Message`)
        message = await this.buildPayload(
          destMessage.channel,
          message,
          attachment
        )
        result = await destMessage.edit(message)
      }
    } else if (mode == "clone") {
      // console.log(`${mode.ucfirst()}: Startup!`)
      // Clone Mode
      // No Source Message
      if (!sourceMessageURL) {
        this.error = true
        this.props.description = `${mode.ucfirst()} Mode: No Source Message sent`
        return false
      }

      const srcMessage = await this.getMessage(client, sourceMessageURL)
      // Source Message not found
      if (!srcMessage) {
        this.error = true
        this.props.description = `${mode.ucfirst()} Mode: Couldn't load Source Message ID '${sourceMessageURL}'`
        return false
      }

      const destMessage = await this.getMessage(client, destMessageURL)
      // Channel & Destination Message not found
      if (!channel && !destMessage) {
        this.error = true
        if (!channel) {
          this.props.description = `${mode.ucfirst()} Mode: Channel not found`
        } else if (!destMessage) {
          this.props.description = `${mode.ucfirst()} Mode: Destination Message not found`
        }
        return false
      }

      // Destination Message
      if (destMessage) {
        let notPostedByClientError = (!rookhook) && (destMessage.author.id !== client.user.id)
        let notPostedByHookError = (rookhook) && (false)

        // Message not posted by client user
        if (notPostedByClientError) {
          this.error = true
          this.props.description = [
            `Destination Message not editable by ${interaction.guild.members.me}`,
            destMessageURL
          ]
          return false
        }

        // Message not posted by rookhook
        if (notPostedByHookError) {
          this.error = true
          this.props.description = `Destination Message not editable by rookhook`
          return false
        }

        let this_package = {
          content: srcMessage.content ?? null,
          embeds: srcMessage.embeds ?? null,
          files: srcMessage.attachments?.toJSON() ?? null
        }

        // If rookhook, use hook
        if (rookhook) {
          result = await rookhook.editMessage(destMessage, this_package)
          if (srcMessage.reactions) {
            // do nothing
          }
        } else {
          // Else, use bot
          result = await destMessage.edit(this_package)
          if (srcMessage.reactions) {
            // console.log("Source Message has reactions!")
            for (let [emojiName, reaction] of srcMessage.reactions.cache) {
              let emoji = srcMessage.guild.emojis.cache.find(
                e => (e.name === emojiName) || (e.name === `:${emojiName}:`)
              )
              if (!emoji) {
                emoji = emojiName
              }
              // console.log(emoji)
              let reacted = await destMessage.reactions.resolve(emoji)?.me
              if (!reacted) {
                await destMessage.react(emoji)
              }
            }
          }
        }
      }

      // Clone to Channel
      if (channel && !destMessage) {
        let content = srcMessage.content ?? null
        let embeds = srcMessage.embeds ?? null
        let files = srcMessage.attachments?.toJSON() ?? null
        let this_package = {}
        if (content) {
          this_package.content = content
        }
        if (embeds) {
          this_package.embeds = embeds
        }
        if (files) {
          this_package.files = files
        }

        // If rookhook, use hook
        if (rookhook) {
          // console.log(`${mode.ucfirst()}: rookhook`)
          result = await rookhook.send(this_package)
        } else {
          // Else, use bot
          // console.log(`${mode.ucfirst()}: Message`)
          result = await channel.send(this_package)

          let reactions = await srcMessage.reactions.cache
          if (reactions) {
            for (let [emojiName, rData] of reactions) {
              result.react(emojiName)
            }
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
          // console.log("Couldn't reset rookhook!")
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
              value: `${interaction.user} [${inlineCode(interaction.user.id)}]`
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
              value:
                [
                  interaction?.guild?.name,
                  `[${inlineCode(interaction?.guild?.id)}]`
                ]
            },
            // Sent to what Channel?
            {
              name: "Channel",
              value:
                [
                  `<#${result?.channel?.id}>`,
                  `[${inlineCode(channel?.id)}]`
                ]
            }
          ],
          [
            // Message Link
            {
              name: "Message",
              value: `${result.url} [${inlineCode(result?.id)}]`
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
            avatar: interaction.user.displayAvatarURL({ size: 128 })
          },
          target: {
            name: visages[visage].name,
            avatar: visages[visage].avatar
          }
        }
      }

      // Edit reply to Mod
      embeds.mod = new RookEmbed(client, props.mod)
      await interaction.editReply({ embeds: [ embeds.mod ] })

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
