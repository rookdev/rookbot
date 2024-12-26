// @ts-nocheck

const { ApplicationCommandOptionType, PermissionFlagsBits } = require('discord.js')
const { ModCommand } = require('../../classes/command/modcommand.class')
const { RookEmbed } = require('../../classes/embed/rembed.class')
const timeFormat = require('../../utils/timeFormat')
const path = require('path')
const fs = require('fs')

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
    await interaction.deferReply({ ephemeral: true })

    let channel = interaction.options.getChannel("channel") ?? interaction.channel
    let message = interaction.options.getString("message") ?? ""

    if (channel && (message != "")) {
      let result = await channel.send(message)
      let props = {}
      let embeds = {}
      let resultDateTime = new Date(result.createdTimestamp)
      props.mod = {
        fields: [
          [
            {
              name: "Time",
              value: timeFormat(resultDateTime.getTime())
            }
          ],
          [
            {
              name: "User",
              value: `${interaction.user} (ID: \`${interaction.user.id}\`)`
            }
          ],
          [
            {
              name: "Guild",
              value:
                [
                  interaction?.guild?.name,
                  `(ID: \`${interaction?.guild?.id}\`)`
                ]
            },
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
            {
              name: "Message",
              value: `https://discord.com/channels/${result?.guild?.id}/${result?.channel?.id}/${result?.id} (ID: \`${result?.id}\`)`
            }
          ],
          [
            {
              name: "Content",
              value: message.slice(0,1024)
            }
          ]
        ]
      }

      embeds.mod = new RookEmbed(client, props.mod)
      await interaction.editReply({ embeds: [ embeds.mod ] })

      // Optional: Save the ghost message to a log file
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
