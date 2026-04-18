// @ts-nocheck

// Command Option Types
/**
 * Discord Stuff
 *  Command Option Types
 *  Formatters
 *   codeBlock
 */
const { 
  ApplicationCommandOptionType,
  codeBlock
} = require('discord.js')
// Base Rook Command
const { RookCommand } = require('../../classes/command/rcommand.class')
const mentionFuncs = require('../../utils/formatters/mentions')

module.exports = class RoleEditCommand extends RookCommand {
  constructor(client) {
    let comprops = {
      name: "role_edit",
      category: "admin",
      description: "Edit a Role",
      options: [
        {
          name: "mode",
          description: "Mode",
          type: ApplicationCommandOptionType.String,
          required: true,
          choices: [
            { name: "Rename", value: "rename" },
            { name: "Color",  value: "color" },
            { name: "Delete", value: "delete" }
          ]
        },
        {
          name: "role",
          description: "Selected Role",
          type: ApplicationCommandOptionType.Role
        },
        {
          name: "role-id",
          description: "Selected Role ID",
          type: ApplicationCommandOptionType.String
        },
        {
          name: "role-name",
          description: "New Role Name",
          type: ApplicationCommandOptionType.String
        },
        {
          name: "color",
          description: "New Color (HTML hex code)",
          type: ApplicationCommandOptionType.String
        }
      ],
      testOptions: [
      ]
    }
    let props = {
      title: {
        text: "Role Edit"
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
    let targetInput = coptions?.role ?? coptions["role-id"]
    // Get Target ID
    let targetId = targetInput.replace(/[<#@&!>]/g, '')  // Remove <@>, <@!>, and >

    this.props.description = []
    this.props.fields = []

    let interactionGuild = await this.getGuild(client, interaction)

    let role = null
    if (interactionGuild) {
      role = await this.getCache(client, interactionGuild, "roles", targetId)
    }

    if (role) {
      if (mode == "delete") {
        this.props.description.push(`@${role.name}`)
        if (role.deletable) {
          await role.delete()
        }
      } else if (mode == "color") {
        let oldColor = ""
        let newColors = coptions["color"]
        oldColor = role?.colors
        if (oldColor) {
          oldColor = Object.values(oldColor)
            .filter(v => v)
            .map(v => ("#" + v.toString(16).toUpperCase()))
            .join(", ")
        }
        if (newColors) {
          newColors = newColors.split(",")
          if (typeof newColors != "object") {
            newColors = [ newColors ]
          }
          let tempColors = []
          for (let newColor of newColors) {
            // Get hex color input
            const hexInput = newColor.trim().replace('#', '').toUpperCase()
            // Validate hex string
            const hexRegex = /^[0-9A-F]{6}$/
            if (!hexRegex.test(hexInput)) {
              this.error = true
              this.props.description = "Invalid hex color code. Please provide a valid 6-character hexadecimal string (e.g., #FF5733 or FF5733)."
              return !this.error
            }
            if (!newColor.startsWith("#")) {
              newColor = '#' + newColor
            }
            tempColors.push(newColor.toUpperCase())
          }
          newColors = tempColors.join(", ")
        }
        this.messages.push(
          "👥" +
          JSON.stringify(
            {
              guild: interactionGuild.name,
              role: role.name,
              oldColor,
              newColors,
              action: mode
            }
          )
        )
        if (oldColor != newColors) {
          let tempColors = newColors.split(",")
          if (typeof tempColors != "object") {
            tempColors = [ tempColors ]
          }
          if (tempColors[0]) {
            newColors = {}
            newColors.primaryColor = tempColors[0].trim()
            this.props.color = newColors.primaryColor
          }
          if (tempColors[1]) {
            newColors.secondaryColor = tempColors[1].trim()
          }
          if (tempColors[2]) {
            newColors.tertiaryColor = tempColors[2].trim()
          }
          await role.edit(
            {
              colors: newColors
            }
          )
          this.props.fields.push(
            [
              { name: "Old Color", value: codeBlock(oldColor) },
              {
                name: "New Color",
                value: codeBlock(Object.values(newColors).join(", "))
              }
            ],
            [
              { name: "Role Mention", value: mentionFuncs.roleMention(targetId) }
            ]
          )
        }
      } else if (mode == "rename") {
        let oldName = ""
        let newName = coptions["role-name"]
        oldName = role.name
        if (oldName != newName) {
          await role.edit(
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
              { name: "Role Mention", value: mentionFuncs.roleMention(targetId) }
            ]
          )
        }
      }
    }
  }
}
