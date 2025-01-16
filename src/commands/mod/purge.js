// @ts-nocheck

// Command Option Types, Permission Flags, Formatters: inlineCode
const { ApplicationCommandOptionType, PermissionFlagsBits, inlineCode } = require('discord.js')
// ModCommand
const { ModCommand } = require('../../classes/command/modcommand.class')
// Base Rook Embed
const { RookEmbed } = require('../../classes/embed/rembed.class')
const fileFuncs = require('../../utils/fs/fileFuncs')
const moment = require('moment')
const fs = require('fs')                        // Filesystem manipulation

module.exports = class PurgeCommand extends ModCommand {
  constructor(client) {
    let comprops = {
      name: "purge",
      category: "mod",
      description: "Purge Messages",
      options: [
        {
          name: "amount",
          description: "The number of messages to delete (1 - 100)",
          type: ApplicationCommandOptionType.Integer,
          minValue: 1,
          maxValue: 100,
          required: true
        },
        {
          name: "channel",
          description: "Channel to purge messages from.",
          type: ApplicationCommandOptionType.Channel
        }
      ],
      aliases: [
        {
          name: "clear",
          description: "Purge 100 messages",
          options: { amount: 100 }
        }
      ],
      permissions: [ PermissionFlagsBits.ManageMessages ]
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
    // Get Amount
    const messagesToDelete = coptions.amount
    // Get Channel
    const channel = coptions.channel ?? interaction.channel

    let props = {
      public: {},
      mod:    {},
      log:    {}
    }
    let embeds = {}

    // Amount between 1 & 100
    //  Technically, new SlashCommand interface validates this
    if (messagesToDelete < 1 || messagesToDelete > 100) {
      props.mod.error = true
      props.mod.ephemeral = true
      props.mod.description = `Please specify a number between 1 and 100 '${messagesToDelete}'.`
      this.props = props.mod
      return !props.mod.error
    }

    let success = false         // Success?
    let deletedMessages = null  // Deleted Messages

    try {
      // Try to delete the messages
      deletedMessages = await channel.bulkDelete(
        messagesToDelete,
        true
      )
      success = true
    } catch (error) {
      // Something failed
      success = false
      this.error = true
      this.ephemeral = true
      this.props.description = "I couldn't delete those messages. Make sure they're not older than 14 days."
      return !this.error
    }

    // We succeeded
    if (success) {
      props.public = {
        color: this.profile.colors.success,
        title: {
          emoji: this.profile.emojis.good,
          text: "[ModPost] Success!"
        },
        description: [
          `Successfully purged ${deletedMessages.size} messages in ${channel}`
        ]
      }
      embeds.public = new RookEmbed(client, props.public)
      interaction.channel.send(
        {
          embeds: [ embeds.public ]
        }
      )
      console.log(`/${this.name}: ModPost`)
    }

    // Log the event
    if (success && (!this.DEV || true)) {
      const logsChannel = await this.getChannel(client, interaction, "logging")
      if (logsChannel) {
        props.log = {
          title: {
            text: "[Log] Messages Purged",
            emoji: "🧹"
          },
          fields: [
            [
              { name: "Channel",    value: channel },
              { name: "Purged By",  value: [interaction.user, `${inlineCode(interaction.user.id)}`]},
              { name: "Amount",     value: deletedMessages.size }
            ]
          ]
        }
        embeds.log = new RookEmbed(client, props.log)
        logsChannel.send(
          {
            embeds: [ embeds.log ]
          }
        )
        console.log(`/${this.name}: LogPost`)
      }
    }

    // Log to file
    let now = new moment()
    const logFilePath = fileFuncs.getAPath(
      [
        "src",
        "botlogs"
      ],
      `${this.DEV ? 'DEV' : ''}purgedMessages.log`
    )
    let logEntry = [
      `[${now.toISOString()}]`,
      `Actor:   ${interaction.user.tag} (ID: ${interaction.user.id})`,
      `Action:  Purging ${messagesToDelete} messages`,
      `Guild:   ${interaction.guild.name} (ID: ${interaction.guild.id})`,
      `Channel: #${channel.name} (ID: ${channel.id})`,
      `Amount:  ${deletedMessages.size}`,
      '--------------------------------'
    ]

    fs.appendFileSync(logFilePath, logEntry.join("\n") + "\n", "utf8")
    console.log(`/${this.name}: LogFile`)

    // If error, report error to Mod
    if (!success) {
      // Reply to Mod if error for ACTION
      this.ephemeral = true
      let msg = `There was an error when Purging`
      console.log(msg)
      props.mod.title = { text: "[YouPost]" }
      props.mod.error = true
      props.mod.ephemeral = true
      props.mod.description = `I couldn't Purge the messages.`
      embeds.mod = await new RookEmbed(client, props.mod)
      await this.send(
        client,
        interaction,
        [ embeds.mod ]
      )
      this.null = true
    }

    return success
  }
}
