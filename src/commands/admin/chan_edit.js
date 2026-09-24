// @ts-nocheck

// Command Option Types
/**
 * Discord Stuff
 *  Command Option Types
 *  Formatters
 *   codeBlock
 */
const { ApplicationCommandOptionType, inlineCode } = require('discord.js')
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
            { name: "Sync",   value: "sync" },
            { name: "Move",   value: "move" },
            { name: "Sort",   value: "sort" },
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
        },
        {
          name: "parent",
          description: "Parent Channel",
          type: ApplicationCommandOptionType.Channel
        },
        {
          name: "parent-id",
          description: "Parent Channel ID",
          type: ApplicationCommandOptionType.String
        },
        {
          name: "position",
          description: "Position Placement",
          type: ApplicationCommandOptionType.Integer
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
      } else if (mode == "move") {
        let parentInput = coptions?.parent ?? coptions["parent-id"]
        // Get Parent ID
        let parentId = parentInput?.replace(/[<#@&!>]/g, '')  // Remove <@>, <@!>, and >
        let parentChannel = await this.getCache(client, interactionGuild, "channels", parentId)
        let position = coptions?.position
        if (parentId && parentChannel) {
          let oldParentId = channel.parentId
          await channel.setParent(parentChannel)
          this.props.fields.push(
            [
              { name: "Old Parent", value: oldParentId ? mentionFuncs.channelMention(parentId) : "*None*" },
              { name: "New Parent", value: mentionFuncs.channelMention(parentId) }
            ],
            [
              { name: "Channel Mention", value: mentionFuncs.channelMention(targetId) }
            ]
          )
        } else if (position) {
          let oldPosition = channel.position
          let oldRawPosition = channel.rawPosition
          await channel.setPosition(position)
          this.props.fields.push(
            [
              { name: "Old Position",     value: inlineCode(oldPosition) },
              { name: "Old Raw Position", value: inlineCode(oldRawPosition) }
            ],
            [
              { name: "New Position", value: inlineCode(position) }
            ],
            [
              { name: "Channel Mention", value: mentionFuncs.channelMention(targetId) }
            ]
          )
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
      } else if (mode == "sort") {
        let children = await channel?.children?.cache
        let channels = []
        if (children) {
          for (let [cID, child] of children) {
            if (!channels[child.name]) {
              channels[child.name] = []
            }
            channels[child.name][cID] = child
          }
          this.props.fields = []
          this.props.fields.push(
            [
              {
                name: "Category",
                value: mentionFuncs.channelMention(channel.id)
              }
            ]
          )
          this.props.description = []
          this.props.description.push("**Children**")
          let position = 0
          for (let channelName of Object.keys(channels).toSorted()) {
            for (let childId of Object.keys(channels[channelName]).toSorted()) {
              let child = channels[channelName][childId]
              await child.setPosition(position++)
              this.props.description.push(
                inlineCode(child.position) + " " + mentionFuncs.channelMention(childId)
              )
            }
          }
        }
      } else if (mode == "sync") {
        this.props.description.push("---")
        if (!channel.permissionsLocked) {
          await channel.lockPermissions()
          this.props.description.push(`${mentionFuncs.channelMention(channel.id)} synced to ${mentionFuncs.channelMention(channel.parent.id)}`)
        } else {
          this.props.description.push(`${mentionFuncs.channelMention(channel.id)} already synced to ${mentionFuncs.channelMention(channel.parent.id)}`)
        }
      }
    }
  }
}
