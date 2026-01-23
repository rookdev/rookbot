// @ts-nocheck

// Formatters: inlineCode
const { inlineCode } = require('discord.js')
// ModCommand
const { ModCommand } = require('../../classes/command/modcommand.class')
// Rook-branded Embed
const { RookEmbed } = require('../../classes/embed/rembed.class')
const fileFuncs = require('../../utils/fs/fileFuncs')
const dbFuncs = require('../../utils/db/dbFuncs')

module.exports = class ReactionRolesCommand extends ModCommand {
  constructor(client) {
    let comprops = {
      name: "rr",
      category: "mod",
      description: "Create Reaction Role posts for cloning.",
    }
    let props = {}

    super(
      client,
      {...comprops},
      {...props}
    )
  }

  // declare props: import('../../types/embed').EmbedProps

  async action(client, interaction, coptions) {
    let messages = []
    let guild = interaction.guild

    let rrs = await dbFuncs.getDB(
      guild.id,
      "rrs"
    )
    if (!rrs) {
      messages.push(`${this.profile.emojis.warning} Reaction Roles not found for '${guild.name}' [${inlineCode(guild.id)}]`)
      this.error = true
      this.props.description = messages
      return false
    }

    for (let [msgID, msgData] of Object.entries(rrs)) {
      this.props = {}
      this.props.description = []
      for (let [emojiName, roleData] of Object.entries(msgData)) {
        // Title
        if (emojiName == "#title") {
          this.props.title = { text: roleData }
        } else if (emojiName == "#description") {
          // Description
          this.props.description.push(roleData)
          this.props.description.push("")
        } else if (!emojiName.includes("#")) {
          // Emoji : { Role, Description }
          let roleName = roleData
          let roleDesc = ""
          if (typeof roleData != "string") {
            roleDesc = roleData["description"] ?? ""
            roleName = roleData["role"] ?? ""
          }
          // Emoji : Role
          let emoji = interaction.guild.emojis.cache.find(
            e => (e.name === emojiName) || (e.name === `:${emojiName}:`)
          )
          let role = interaction.guild.roles.cache.find(
            r => r.name === roleName
          )
          if (!emoji) {
            emoji = emojiName
          }
          this.props.description.push(`${emoji}: ${role} ${roleDesc}`)
        }
      }
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deleteReply()
      }

      let embed = new RookEmbed(client, this.props)
      let post = await interaction.channel.send({ embeds: [ embed ] })

      for (let emojiName of Object.keys(msgData)) {
        if (emojiName.includes("#")) {
          continue
        }

        // Emoji : Role
        let emoji = interaction.guild.emojis.cache.find(
          e => (e.name === emojiName) || (e.name === `:${emojiName}:`)
        )
        if (!emoji) {
          emoji = emojiName
        }

        let reacted = await post.reactions.resolve(emoji)?.me
        if (!reacted) {
          await post.react(emoji)
        }
      }
    }


    return !this.error
  }
}
