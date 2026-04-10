// @ts-nocheck

const { ApplicationCommandOptionType, AttachmentBuilder } = require('discord.js')
// AdminCommand
const { AdminCommand } = require('../../classes/command/admincommand.class')
// Pretty-print time durations
const mentionFuncs = require('../../utils/formatters/mentions')
const globalFuncs = require('../../utils/primitives/globalFuncs')
const fileFuncs = require('../../utils/fs/fileFuncs')

module.exports = class ServerProfileCommand extends AdminCommand {
  constructor(client) {
    let comprops = {
      name: "server_profile",
      category: "admin",
      description: "Server Profile",
      options: [
        {
          name: "manifest",
          description: "Server Profile Manifest",
          type: ApplicationCommandOptionType.Attachment,
          required: true
        },
        {
          name: "args",
          description: "Arguments",
          type: ApplicationCommandOptionType.String
        }
      ],
      flags: {
        test: "basic"
      }
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
    let args          = coptions?.args
    let manifestAtch  = interaction.options.getAttachment("manifest")
    let manifestJSON  = await fileFuncs.getAURL(manifestAtch.attachment, "json")

    args = manifestJSON.profiles.args
    let profile = manifestJSON.profiles.team

    let role = profile.role.name
    let category = profile.category.name
    let channels = profile.category.channels

    let i = 1
    for (let arg of args) {
      role = role.replace(`{arg${i}}`, arg)
      category = category.replace(`{arg${i}}`, arg)
      i++
    }

    this.messages.push(
      `_0_${role}`,
      ` >${category}`
    )
    for (let channel of channels) {
      let chanName = channel.name
      i = 1
      for (let arg of args) {
        chanName = chanName.replace(`{arg${i}}`, arg)
        chanName = chanName.replace(`{lc(arg${i})}`, arg.toLowerCase())
        i++
      }

      let chanType = ""
      switch(channel.type) {
        case "text":
          chanType = "#"
          break
        case "voice":
          chanType = ".o)"
          break
      }
      this.messages.push(`  ${chanType}${chanName}`)
    }

    let outputAtch = new AttachmentBuilder()
      .setName("output.json")
      .setFile(Buffer.from(JSON.stringify(manifestJSON, null, "  ")))

    await interaction.editReply(
      {
        content: "See attached!",
        files: [ outputAtch ]
      }
    )
    this.null = true

    return !this.error
  }
}
