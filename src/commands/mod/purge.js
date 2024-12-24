// @ts-nocheck

const { ApplicationCommandOptionType, PermissionFlagsBits } = require('discord.js')
const { ModCommand } = require('../../classes/command/modcommand.class')
const { RookEmbed } = require('../../classes/embed/rembed.class')
const colors = require('../../dbs/colors.json')
const path = require('path')
const fs = require('fs')

module.exports = class PurgeCommand extends ModCommand {
  constructor(client) {
    let comprops = {
      name: "purge",
      category: "mod",
      description: "Purge Messages",
      options: [
        {
          name: "amount",
          description: "The number of messages to delete (1-100).",
          type: ApplicationCommandOptionType.Integer,
          required: true
        },
        {
          name: "channel",
          description: "Channel to purge messages from.",
          type: ApplicationCommandOptionType.Channel
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

  async action(client, interaction, coptions={}) {
    const messagesToDelete = coptions.amount
    const channel = coptions.channel || interaction.channel

    let props = {
      public: {},
      mod:    {},
      log:    {}
    }
    let embeds = {}

    if (messagesToDelete < 1 || messagesToDelete > 100) {
      props.mod.error = true
      props.mod.ephemeral = true
      props.mod.description = `Please specify a number between 1 and 100 '${messagesToDelete}'.`
      this.props = props.mod
      return !props.mod.error
    }

    let success = false
    let deletedMessages = null

    try {
      deletedMessages = await channel.bulkDelete(
        messagesToDelete,
        true
      )
      success = true
    } catch (error) {
      success = false
      this.error = true
      this.ephemeral = true
      this.props.description = "I couldn't delete those messages. Make sure they're not older than 14 days."
      return !this.error
    }

    if (success) {
      props.public = {
        color: colors["success"],
        title: {
          emoji: "🟢",
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
              { name: "Purged By",  value: `${interaction.user} (ID: \`${interaction.user.id}\`)` },
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

    let now = new Date()
    let logFilePath = path.join(
      __dirname,
      "..",
      "..",
      "botlogs",
      ((this.DEV ? "DEV" : "") + "purgedMessages.log")
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
