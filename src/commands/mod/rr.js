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
    let guild = interaction.guild

    // DB
    let rrs = null
    let messages = []
    let dbRes = await dbFuncs.getDB(
      guild.id,
      "rrs"
    )
    rrs = dbRes[0]
    this.messages.push(...dbRes[1])
    // /DB

    if (!rrs) {
      messages.push(`${this.profile.emojis.warning} Reaction Roles not found for '${guild.name}' [${inlineCode(guild.id)}]`)
      this.error = true
      this.props.description = messages
      return false
    }

    for (let [msgID, msgData] of Object.entries(rrs)) {
      this.props = {}
      this.props.description = []
      if (msgID.indexOf("#") > -1) {
        continue 
      } else {
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
            let emoji = await this.getCache(client, interaction.guild, "emojis", emojiName)
            let role = await this.getCache(client, interaction.guild, "roles", roleName)
            if (!emoji) {
              emoji = emojiName
            }
            this.props.description.push(`${emoji}: ${role} ${roleDesc}`)
          }
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
        let emoji = await this.getCache(client, interaction.guild, "emojis", emojiName)
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
