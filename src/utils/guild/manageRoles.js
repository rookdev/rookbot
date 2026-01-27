const { MessageReaction, User } = require('discord.js')
// Rook-branded Client
const { RookClient } = require('../../classes/objects/rclient.class')
const dbFuncs = require('../../utils/db/dbFuncs')
const getters = require('../../utils/guild/getters')

/**
 * Logs edited messages from the server.
 * @param {RookClient} client
 * @param {MessageReaction} reaction
 * @param {User} user
 */
const manageRoles = async (client, reaction, user, mode="add") => {
  let result = false

  if (reaction.partial) {
    reaction = await reaction.fetch()
  }

  let message = reaction.message
  if (message.partial) {
    message = await message.fetch()
  }

  let guild = message.guild

  // DB
  let dbRes = await dbFuncs.getDB(
    guild.id,
    "rrs"
  )
  let rrs = dbRes[0]
  let messages = dbRes[1]
  // /DB

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

      let emoji = await getters.getCache(client, message.guild, "emojis", emojiName)

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
  if (typeof roleName == "object") {
    if (roleName["role"]) {
      roleName = roleName["role"]
    }
  }
  let role = await getters.getCache(client, message.guild, "roles", roleName)

  if(!role) {
    return [result, messages]
  }

  let guildMember = await getters.getCache(client, message.guild, "members", user.id)
  if (mode == "add") {
    guildMember.roles.add(role)
    // if admin, cycle through reactions on this post
    //  for each reaction, cycle through users who reacted
    //   for each user, assign the role, just in case
    // Get list of roles
    let rolesDB = {}
    let dbRes = await dbFuncs.getDB(
      guild.id,
      "roles"
    )
    rolesDB = dbRes[0]
    messages = dbRes[1]

    if (rolesDB) {
      // Get Admin roles
      let ADMIN_ROLES = rolesDB["admin"]
      if (await guildMember.roles.cache.some(r=>ADMIN_ROLES.includes(r.name))) {
        // We're an Admin
        // messages.push("   We're an Admin!")
        for (let [rName, thisReaction] of await message.reactions.cache) {
          // Cycle through reactions
          if (rName.length > 10) {
            rName = thisReaction.emoji.name
          }
          // messages.push(`    Re: ${rName}`)
          for (let [uName, thisUser] of await thisReaction.users.cache) {
            // Cycle through users
            // messages.push(`     Us: ${thisUser.tag}`)
            let thisMember = await getters.getCache(client, message.guild, "members", thisUser.id)
            if (thisMember) {
              // If this user doesn't have this role
              let thisRole = rrs[message.id][rName]
              if (typeof thisRole == "object") {
                thisRole = thisRole["role"]
              }
              // messages.push(`      Ro: ${thisRole}`)
              thisRole = await getters.getCache(client, message.guild, "roles", thisRole)
              if (thisRole) {
                if (! await getters.getCache(client, thisMember, "roles", thisRole.name)) {
                  thisMember.roles.add(thisRole)
                }
              }
            }
          }
        }
      }
    }
  } else if (mode == "remove") {
    guildMember.roles.remove(role)
  }

  result = true

  return [result, messages]
}

module.exports = manageRoles
