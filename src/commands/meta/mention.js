// @ts-nocheck

// Command Option Types
const { ApplicationCommandOptionType } = require('discord.js')
// Base Rook Command
const { RookCommand } = require('../../classes/command/rcommand.class.js')

module.exports = class MentionCommand extends RookCommand {
  constructor(client) {
    let comprops = {
      name: "mention",
      category: "meta",
      description: "Give code to post a mention in chat",
      flags: { target: "required" },
      options: [
        {
          name: "target-id",
          description: "ID of target",
          type: ApplicationCommandOptionType.String,
          required: true
        },
        {
          name: "target-type",
          description: "Mention Type",
          type: ApplicationCommandOptionType.String,
          choices: [
            { name: "Channel",        value: "channel" },
            { name: "Role",           value: "role" },
            { name: "Text Channel",   value: "channel" },
            { name: "User",           value: "user" },
            { name: "Voice Channel",  value: "channel" }
          ]
        }
      ],
      testOptions: [
        { "target-id": "<#895062573999878234>" },   // #bot-console
        { "target-id": "<@&833812507012366366>" },  // @Admin
        { "target-id": "<@!263968998645956608>" },  // @Minnie
        { "target-id": "<@!1111517386588307536>" }, // @castIe
        { "target-id": "<#!1097065219014021130>" }  // Voice:General
      ]
    }
    let props = {
      title: {
        text: "Mention Helper"
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
    // Get Target Input
    let targetInput   = coptions["target-id"]
    // Get Target ID
    let targetId      = targetInput.replace(/[<#@&!>]/g, '')  // Remove <@>, <@!>, and >
    // Get Target Type
    let targetType    = coptions["target-type"] || "channel"
    let targetMention = ""

    // console.log(
    //   [
    //     `/mention: Input`,
    //     `Input:    ${targetInput}`,
    //     `ID:       ${targetId}`,
    //     `InType:   ${targetType}`
    //   ].join("\n")
    // )

    for(let [check, mentionType] of Object.entries
      (
        // Check for Mention Type
        {
          "\@\!": "user",
          "@":    "user",
          "\#\!": "channel",
          "#":    "channel"
        }
      )
    ) {
      if(targetInput.indexOf(check) > -1) {
        targetType = mentionType
      }
    }
    // If @&, it's a Role Mention
    if(targetInput.indexOf("@") > -1 && targetInput.indexOf("&") > -1) {
      targetType = "role"
    }

    // console.log(
    //   `CalcType: ${targetType}`
    // )

    this.props.playerTypes = {
      user: "bot",
      target: "guild"
    }

    switch(targetType) {
      // Channel
      case "channel":
        targetMention = `<#${targetId}>`
        break
      // Role
      case "role":
        targetMention = `<@&${targetId}>`
        break
      // User
      case "user":
        targetMention = `<@!${targetId}>`
        // Get Guild
        let guild = await client.guilds.fetch(interaction.guild.id)
        if (guild) {
          // Get Guild Member
          let targetMember = await guild.members.fetch(targetId)
          if (targetMember) {
            // Set Target to Member
            this.props.playerTypes = {
              user: "bot",
              target: "target"
            }
            this.props.entities = {
              target: {
                type:   "target",
                id:     targetId,
                name:   targetMember.displayName,
                url:    "http://example.com/target",
                avatar: targetMember.displayAvatarURL({ size: 128 }),
                tag:    targetMember.user.tag
              }
            }
          }
        }
        break
      default:
        targetMention = "Error"
        this.error = true
        this.props.description = `Invalid channel type ['${targetType}']`
        return false
    }

    // console.log(
    //   [
    //     `Output:   ${targetMention}`,
    //     ""
    //   ].join("\n")
    // )

    if(!this.error) {
      this.props.fields = [
        [
          // Mention Type
          {
            name: "Type",
            value: targetType
          }
        ],
        [
          // Mention ID
          {
            name: "ID",
            value: `\`${targetId}\``
          }
        ],
        [
          // Mention Link
          {
            name: "Mention",
            value: targetMention
          }
        ],
        [
          // Mention Raw Code
          {
            name: "Code",
            value: `\`${targetMention}\``
          }
        ]
      ]
    }

    return !this.error
  }
}
