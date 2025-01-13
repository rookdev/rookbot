const { MessageReaction, User } = require('discord.js')
// Rook-branded Client
const { RookClient } = require('../../classes/objects/rclient.class')
const path = require('path')
const fs = require('fs')

/**
 * Logs edited messages from the server.
 * @param {RookClient} client
 * @param {MessageReaction} reaction
 * @param {User} user
 */
const manageRoles = async (client, reaction, user, mode="add") => {
  let result = false
  let messages = []

  if (reaction.partial) {
    reaction = await reaction.fetch()
  }

  if (reaction.message.partial) {
    await reaction.message.fetch()
  }

  let guild = reaction.message.guild

  let rrPath = path.join(
    __dirname,
    "..",
    "dbs",
    guild.id,
    "rrs"
  )

  if (!fs.existsSync(rrPath + ".json")) {
    messages.push(`${client.profile.emojis.fail} Reaction Roles not found for '${guild.name}' [${guild.id}]`)
    return [result, messages]
  }

  let rrs = require(rrPath)

  if (!rrs[reaction.message.id]) {
    // messages.push(`${client.profile.emojis.warning} Not a watched message: ${reaction.message.guild.name}/${reaction.message.channel.name}/${user.username}/${reaction.emoji.name}`)
    return [result, messages]
  }
  if (!rrs[reaction.message.id][reaction.emoji.name]) {
    messages.push(`${client.profile.emojis.warning} Not a watched emoji: ${reaction.message.guild.name}/${reaction.message.channel.name}/${user.username}/${reaction.emoji.name}`)
    return [result, messages]
  }
  messages.push(`${mode.toUpperCase()}: Watched Message & Emoji: ${reaction.message.guild.name}/${reaction.message.channel.name}/${user.username}/${reaction.emoji.name}`)

  if (!reaction.me) {
    await reaction.react()
    for (let emojiName of Object.keys(rrs[reaction.message.id])) {
      if (emojiName.includes("#")) {
        continue
      }

      let emoji = await reaction.message.guild.emojis.cache.find(
        e => (e.name === emojiName) || (e.name === `:${emojiName}:`)
      )

      if (!emoji) {
        emoji = emojiName
      }

      let reacted = await reaction.message.reactions.resolve(emoji)?.me
      if (!reacted) {
        try {
          await reaction.message.react(emoji)
        } catch (error) {
          messages.push(emojiName,emoji,error)
          return [result, messages]
        }
      }
    }
  }

  let roleName = rrs[reaction.message.id][reaction.emoji.name]
  let role = reaction.message.guild.roles.cache.find(
    r => r.name === roleName
  )

  if(!role) {
    return [result, messages]
  }

  let guildMember = await reaction.message.guild.members.fetch(user.id)
  if (mode == "add") {
    guildMember.roles.add(role)
  } else if (mode == "remove") {
    guildMember.roles.remove(role)
  }

  result = true

  return [result, messages]
}

module.exports = manageRoles
