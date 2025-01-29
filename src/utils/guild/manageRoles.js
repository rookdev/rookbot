const { MessageReaction, User } = require('discord.js')
// Rook-branded Client
const { RookClient } = require('../../classes/objects/rclient.class')
const fileFuncs = require('../../utils/fs/fileFuncs')

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

  let message = reaction.message
  if (message.partial) {
    message = await message.fetch()
  }

  let guild = message.guild

  let rrs = fileFuncs.getAFile(
    [
      "src",
      "dbs",
      guild.id
    ],
    "rrs.json"
  )
  if (!rrs) {
    messages.push(`${client.profile.emojis.fail} Reaction Roles not found for '${guild.name}' [${guild.id}]`)
    return [result, messages]
  }

  if (!rrs[message.id]) {
    // messages.push(`${client.profile.emojis.warning}: Message${client.profile.emoji.no}: ${message.guild.name}/${message.channel.name}/${user.username}/${reaction.emoji.name}`)
    return [result, messages]
  }
  if (!rrs[message.id][reaction.emoji.name]) {
    messages.push(`${client.profile.emojis.warning}: Message${client.profile.emojis.yes} Emoji${client.profile.emojis.no}: ${message.guild.name}/${message.channel.name}/${user.username}/${reaction.emoji.name}`)
    return [result, messages]
  }
  messages.push(`${client.profile.emojis[mode.toLowerCase()]}: Message${client.profile.emojis.yes} Emoji${client.profile.emojis.yes}: ${message.guild.name}/${message.channel.name}/${user.username}/${reaction.emoji.name}`)

  if (!reaction.me) {
    await reaction.react()
    for (let emojiName of Object.keys(rrs[message.id])) {
      if (emojiName.includes("#")) {
        continue
      }

      let emoji = await message.guild.emojis.cache.find(
        e => (e.name === emojiName) || (e.name === `:${emojiName}:`)
      )

      if (!emoji) {
        emoji = emojiName
      }

      let reacted = await message.reactions.resolve(emoji)?.me
      if (!reacted) {
        try {
          await message.react(emoji)
        } catch (error) {
          messages.push(emojiName,emoji,error)
          return [result, messages]
        }
      }
    }
  }

  let roleName = rrs[message.id][reaction.emoji.name]
  let role = message.guild.roles.cache.find(
    r => r.name === roleName
  )

  if(!role) {
    return [result, messages]
  }

  let guildMember = await message.guild.members.fetch(user.id)
  if (mode == "add") {
    guildMember.roles.add(role)
  } else if (mode == "remove") {
    guildMember.roles.remove(role)
  }

  result = true

  return [result, messages]
}

module.exports = manageRoles
