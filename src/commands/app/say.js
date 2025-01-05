// @ts-nocheck

/**
 * Discord
 *  Command Option Types
 *  Permission Flags
 *  Message Flags
 *  Formatters
 *   inlineCode
 */
const {
  ApplicationCommandOptionType,
  PermissionFlagsBits,
  MessageFlags,
  inlineCode
} = require('discord.js')
// ModCommand
const { ModCommand } = require('../../classes/command/modcommand.class')
// Base Rook Embed
const { RookEmbed } = require('../../classes/embed/rembed.class')
// Use Discord HammerTime
const timeFormat = require('../../utils/timeFormat')
const path = require('path')  // Easy filepath management
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
      category: "bot",
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
        }
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

  async getMessage(client=null, messageURL="") {
    let message = null

    if (!client) {
      console.log("No client sent")
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

    // Result
    let result = null

    // No Message
    if ((message == "") && !sourceMessageURL) {
      this.error = true
      this.props.description = "No message content sent"
      return false
    }
    // Message too long
    if (message.length > 1024) {
      this.error = true
      this.props.description = `Message too long [${message.length}]`
      return false
    }

    // Say Mode
    if (mode == "say") {
      result = await channel.send(message)
    } else if (mode == "edit") {
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

      // Message not posted by client user
      if (destMessage.author.id !== client.user.id) {
        this.error = true
        this.props.description = [
          `Destination Message not editable by ${destGuild.members.me}`,
          destMessageURL
        ]
        return false
      }

      result = await destMessage.edit(message)
    } else if (mode == "clone") {
      // Clone Mode
      // No Source Message
      if (!sourceMessageURL) {
        this.error = true
        this.props.description = "${mode.ucfirst()} Mode: No Source Message sent"
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
        // Message not posted by client user
        if (destMessage.author.id !== client.user.id) {
          this.error = true
          this.props.description = `${destMessage.url} not editable by ${destGuild.members.me}`
          return false
        }

        let this_package = {
          content: srcMessage.content ?? null,
          embeds: srcMessage.embeds ?? null
        }

        result = await destMessage.edit(this_package)
      }

      // Clone to Channel
      if (channel) {
        let content = srcMessage.content ?? null
        let embeds = srcMessage.embeds ?? null
        let this_package = {}
        if (content) {
          this_package.content = content
        }
        if (embeds) {
          this_package.embeds = embeds
        }
        channel.send(this_package)
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
      let resultDateTime = new Date(result.createdTimestamp)
      props.mod = {
        fields: [
          [
            // Posted Time
            {
              name: "Time",
              value: timeFormat(resultDateTime.getTime())
            }
          ],
          [
            // Whodunnit?
            {
              name: "User",
              value: `${interaction.user} (ID: ${inlineCode(interaction.user.id)})`
            }
          ],
          [
            // Mode
            {
              user: "Mode",
              value: mode.ucfirst()
            }
          ],
          [
            // Sent in what Guild?
            {
              name: "Guild",
              value:
                [
                  interaction?.guild?.name,
                  `(ID: ${inlineCode(interaction?.guild?.id)})`
                ]
            },
            // Sent to what Channel?
            {
              name: "Channel",
              value:
                [
                  `<#${result?.channel?.id}>`,
                  `(ID: ${inlineCode(channel?.id)})`
                ]
            }
          ],
          [
            // Message Link
            {
              name: "Message",
              value: `${result.url} (ID: ${inlineCode(result?.id)})`
            }
          ],
          [
            // Message Content
            {
              name: "Content",
              value: message.slice(0,1024)
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

      // Edit reply to Mod
      embeds.mod = new RookEmbed(client, props.mod)
      await interaction.editReply({ embeds: [ embeds.mod ] })

      // Save the ghost message to a log file
      const logFilePath = path.join(
        __dirname,
        '..',
        '..',
        'botlogs',
        `${this.DEV ? 'DEV' : ''}ghostMessages.log`
      )
      let logEntry = [
        `[${new Date().toISOString()}]`,
        `Author:      ${interaction.user.tag} (ID: ${interaction.user.id})`,
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
      logsChannel.send({ embeds: [ embeds.mod ] })
      this.null = true
    }

    return true
  }
}
