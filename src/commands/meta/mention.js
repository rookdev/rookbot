// @ts-nocheck

const { ApplicationCommandOptionType } = require('discord.js')
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
        { "target-id": "<#895062573999878234>" },
        { "target-id": "<@&833812507012366366>" },
        { "target-id": "<#895062573999878234>" },
        { "target-id": "<@!263968998645956608>" },
        { "target-id": "<#!1097065219014021130>" }
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
    let targetInput   = coptions["target-id"]
    let targetId      = targetInput.replace(/[<#@&!>]/g, '');  // Remove <@>, <@!>, and >
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
    if(targetInput.indexOf("@") > -1 && targetInput.indexOf("&") > -1) {
      targetType = "role"
    }

    // console.log(
    //   `CalcType: ${targetType}`
    // )

    switch(targetType) {
      case "channel":
        targetMention = `<#${targetId}>`
        break
      case "role":
        targetMention = `<@&${targetId}>`
        break
      case "user":
        targetMention = `<@!${targetId}>`
        break
      default:
        targetMention = "Error"
        this.error = true
        this.props.description = `Invalid channel type ['${targetType}']`
        break
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
          {
            name: "Type",
            value: targetType
          }
        ],
        [
          {
            name: "ID",
            value: `\`${targetId}\``
          }
        ],
        [
          {
            name: "Mention",
            value: targetMention
          }
        ],
        [
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
