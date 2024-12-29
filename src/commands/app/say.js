// @ts-nocheck

/**
 * Discord
 *  Command Option Types
 *  Permission Flags
 */
const { ApplicationCommandOptionType, PermissionFlagsBits } = require('discord.js')
// ModCommand
const { ModCommand } = require('../../classes/command/modcommand.class')
// Base Rook Embed
const { RookEmbed } = require('../../classes/embed/rembed.class')
// Use Discord Hammertime
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
          type: ApplicationCommandOptionType.String,
          required: true
        },
        {
          name: "channel",
          description: "Channel to send message to",
          type: ApplicationCommandOptionType.Channel
        }
      ],
      permissionsRequired: [ PermissionFlagsBits.ManageMessages ],
      botPermissions: [ PermissionFlagsBits.SendMessages ]
    }
    let props = {}
    super(
      client,
      {...comprops},
      {...props}
    )
  }

  async execute(client, interaction, coptions={}, independent=false) {
    // Defer Ephemeral
    await interaction.deferReply({ ephemeral: true })

    // Get Channel
    let channel = interaction.options.getChannel("channel") ?? interaction.channel
    // Get Message
    let message = interaction.options.getString("message") ?? ""

    // If we have a channel and a message
    if (channel && (message != "")) {
      // Send the message
      let result = await channel.send(message)

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
              value: `${interaction.user} (ID: \`${interaction.user.id}\`)`
            }
          ],
          [
            // Sent in what Guild?
            {
              name: "Guild",
              value:
                [
                  interaction?.guild?.name,
                  `(ID: \`${interaction?.guild?.id}\`)`
                ]
            },
            // Sent to what Channel?
            {
              name: "Channel",
              value:
                [
                  `<#${result?.channel?.id}>`,
                  `(ID: \`${channel?.id}\`)`
                ]
            }
          ],
          [
            // Message Link
            {
              name: "Message",
              value: `https://discord.com/channels/${result?.guild?.id}/${result?.channel?.id}/${result?.id} (ID: \`${result?.id}\`)`
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
