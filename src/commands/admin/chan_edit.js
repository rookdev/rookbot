// @ts-nocheck

// Command Option Types
/**
 * Discord Stuff
 *  Command Option Types
 *  Formatters
 *   codeBlock
 */
const { ApplicationCommandOptionType } = require('discord.js')
// Base Rook Command
const { RookCommand } = require('../../classes/command/rcommand.class')
const mentionFuncs = require('../../utils/formatters/mentions')

module.exports = class ChannelEditCommand extends RookCommand {
  constructor(client) {
    let comprops = {
      name: "chan_edit",
      category: "admin",
      description: "Edit a Channel",
      options: [
        {
          name: "mode",
          description: "Mode",
          type: ApplicationCommandOptionType.String,
          required: true,
          choices: [
            { name: "Rename", value: "rename" },
            { name: "Delete", value: "delete" }
          ]
        },
        {
          name: "channel",
          description: "Selected Channel",
          type: ApplicationCommandOptionType.Channel
        },
        {
          name: "channel-id",
          description: "Selected Channel ID",
          type: ApplicationCommandOptionType.String
        },
        {
          name: "channel-name",
          description: "New Channel Name",
          type: ApplicationCommandOptionType.String
        }
      ],
      testOptions: [
      ]
    }
    let props = {
      title: {
        text: "Channel Edit"
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
    let mode = coptions.mode ?? "rename"
    let targetInput = coptions?.channel ?? coptions["channel-id"]
    // Get Target ID
    let targetId = targetInput.replace(/[<#@&!>]/g, '')  // Remove <@>, <@!>, and >

    this.props.description = []
    this.props.fields = []

    let interactionGuild = await this.getGuild(client, interaction)

    let channel = null
    if (interactionGuild) {
      channel = await this.getCache(client, interactionGuild, "channels", targetId)
    }

    if (channel) {
      if (mode == "delete") {
        this.props.description.push(`#${channel.name}`)
        let children = await channel?.children?.cache
        if (children) {
          this.props.description.push("---")
          for (let [cID, child] of children) {
            this.props.description.push(`#${child.name}`)
            if (child.deletable) {
              await child.delete()
            }
          }
        }
        if (channel.deletable) {
          await channel.delete()
        }
      } else if (mode == "rename") {
        let oldName = ""
        let newName = coptions["channel-name"]
        oldName = channel.name
        if (oldName != newName) {
          await channel.edit(
            {
              name: newName
            }
          )
          this.props.fields.push(
            [
              { name: "Old Name", value: oldName },
              { name: "New Name", value: newName }
            ],
            [
              { name: "Channel Mention", value: mentionFuncs.channelMention(targetId) }
            ]
          )
        }
      }
    }
  }
}
