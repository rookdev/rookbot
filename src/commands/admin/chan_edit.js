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
const globalFuncs = require('../../utils/primitives/globalFuncs')
const stringFuncs = require('../../utils/primitives/stringFuncs')

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
            { name: "Rename",       value: "set" },
            { name: "Sync",         value: "sync" },
            { name: "Move",         value: "move" },
            { name: "Sort",         value: "sort" },
            { name: "Set",          value: "set" },
            { name: "Toggle NSFW",  value: "nsfw" },
            { name: "Delete",       value: "delete" }
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
          name: "channel-topic",
          description: "New Channel Topic",
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
    let mode = coptions.mode ?? "set"

    let targetInput = coptions?.channel ?? coptions["channel-id"]

    this.props.description = []

    if (!targetInput) {
      this.error = true
      this.props.description.push("No Target Channel Received!")
      return false
    }

    // Get Target ID
    let targetId = targetInput.replace(/[<#@&!>]/g, '')  // Remove <@>, <@!>, and >

    let interactionGuild = await this.getGuild(client, interaction)

    let channel = null
    if (interactionGuild) {
      channel = await this.getCache(client, interactionGuild, "channels", targetId)
    }

    this.props.fields = []

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
      } else if (["set","nsfw"].includes(mode)) {
        let oldSet = ""
        let newSet = ""
        let setType = "name"

        if (mode == "nsfw") {
          setType = "nsfw"
        } else if (coptions["channel-name"]) {
          setType = "name"
        } else if (coptions["channel-topic"]) {
          setType = "topic"
        }

        if (setType == "name") {
          oldSet = channel.name
          newSet = coptions["channel-name"]

          if (oldSet != newSet) {
            await channel.setName(newSet)
          }
        } else if (setType == "nsfw") {
          oldSet = channel.nsfw
          newSet = !channel.nsfw
          setType = "NSFW"

          if (oldSet != newSet) {
            await channel.setNSFW(newSet)
          }
        } else if (setType == "topic") {
          oldSet = channel.topic
          newSet = coptions["channel-topic"] ?? channel.topic

          if (newSet == "<NONE>") {
            newSet = ""
          }

          if (oldSet != newSet) {
            await channel.setTopic(newSet)
          }
        }

        if (oldSet != newSet) {
          this.props.fields = []
          this.props.fields.push(
            [
              {
                name: "Old " + setType.ucfirst(),
                value: inlineCode(oldSet)
              },
              {
                name: "New " + setType.ucfirst(),
                value: (newSet != "")
                  ? inlineCode(newSet)
                  : "*No Text*"
              }
            ],
            [
              { name: "Channel Mention", value: mentionFuncs.channelMention(targetId) }
            ]
          )
        } else {
          this.props.description = []
          this.props.description.push("No changes received!")
          this.props.fields = []
          this.props.fields.push(
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
                inlineCode(child.position.toString().padStart(2)) +
                mentionFuncs.channelMention(childId)
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
