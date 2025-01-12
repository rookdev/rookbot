// @ts-nocheck

// Formatters: inlineCode
const { inlineCode } = require('discord.js')
// ModCommand
const { ModCommand } = require('../../classes/command/modcommand.class')
// Rook-branded Embed
const { RookEmbed } = require('../../classes/embed/rembed.class')
const path = require('path')  // Easier filepath management
const fs = require('fs')      // Filesystem manipulation

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

    let rrPath = path.join(
      __dirname,
      "..",
      "..",
      "dbs",
      guild.id,
      "rrs"
    )

    if (!fs.existsSync(rrPath + ".json")) {
      messages.push(`${this.profile.emojis.warning} Reaction Roles not found for '${guild.name}' [${inlineCode(guild.id)}]`)
      this.error = true
      this.props.description = messages
      return false
    }

    let rrs = require(rrPath)

    for (let [msgID, msgData] of Object.entries(rrs)) {
      this.props = {}
      this.props.description = []
      for (let [emojiName, roleName] of Object.entries(msgData)) {
        // Title
        if (emojiName == "#title") {
          this.props.title = { text: roleName }
        } else if (emojiName == "#description") {
          // Description
          this.props.description.push(roleName)
          this.props.description.push("")
        } else if (!emojiName.includes("#")) {
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
          this.props.description.push(`${emoji}: ${role}`)
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
