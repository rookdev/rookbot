const { MessageReaction, User, hyperlink } = require('discord.js')
const { RookMessage } = require('../../classes/objects/rmessage.class')
// Rook-branded Client
const { RookClient } = require('../../classes/objects/rclient.class')
const timeConversion = require('../../utils/formatters/timeConversion')
const mentionFuncs = require('../../utils/formatters/mentions')
const dbFuncs = require('../../utils/db/dbFuncs')
const getters = require('../../utils/guild/getters')
const moment = require('moment')

/**
 * Logs edited messages from the server.
 * @param {RookClient} client
 * @param {MessageReaction} reaction
 * @param {User} user
 */
const manageRoles = async (client, reaction, user, mode="add", logging=false) => {
  let result = false
  let messages = []

  if (reaction.partial) {
    reaction = await reaction.fetch()
  }

  let message = reaction.message
  if (message.partial) {
    message = await message.fetch()
  }

  let guild = await getters.getGuild(client, message)

  // DB
  let rrsRes = await dbFuncs.getDB(
    guild.id,
    "rrs"
  )
  let rrs = rrsRes[0]
  // messages.push(...rrsRes[1])
  // /DB

  if (!rrs) {
    // messages.push(`${client.profile.emojis.fail} Reaction Roles not found for ${mentionFuncs.guildMention(guild.name, guild.id, { showID: true, oneLine: true, textOnly: true })}`)
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

  let logRole = false
  if (!reaction.me) {
    await reaction.react()
    for (let emojiName of Object.keys(rrs[message.id])) {
      if (emojiName.includes("#")) {
        if (emojiName == "#log" || emojiName == "log") {
          logRole = rrs[message.id][emojiName]
        }
        continue
      }

      let emoji = await getters.getCachedEmoji(client, guild, emojiName)

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
    if (roleName["log"]) {
      logRole = roleName["log"]
    }
    if (roleName["role"]) {
      roleName = roleName["role"]
    }
  }

  let role = await getters.getCachedRole(client, guild, roleName)
  // console.log(role)

  if(!role) {
    return [result, messages]
  }

  messages.push(`${client.profile.emojis[mode.toLowerCase()]}: Message${client.profile.emojis.yes} Emoji${client.profile.emojis.yes}: ${message.guild.name}/${message.channel.name}/${user.username}/${reaction.emoji.name}/@${role.name}`)

  let guildMember = await getters.getCachedMember(client, guild, user.id)
  if (mode == "add") {
    guildMember.roles.add(role)

    if (logRole) {
      let verifiedDateTime = moment.utc()
      let joinedDateTime = moment.utc(guildMember.joinedTimestamp)
      let durationStr = timeConversion(
        moment.duration(
          Math.abs(
            joinedDateTime.diff(
              verifiedDateTime
            )
          )
        )
      )

      let logsChannel = await getters.getCachedChannel(
        client,
        guild,
        "logs-members"
      )
      let addedMessage = await new RookMessage(
        client,
        null,
        {
          channelName: logsChannel?.id,
          pages: [
            {
              color: client.profile.colors.info,
              title: {
                text: "[Log] Role Logging",
                emoji: "🏷️"
              },
              entities: {
                guild: {
                  name: guild.name,
                  avatar: await guild.iconURL({ size: 128 })
                },
                target: {
                  name: guildMember.user.displayName,
                  avatar: await guildMember.user.displayAvatarURL({ size: 128 })
                }
              },
              playerTypes: {
                user: "guild",
                target: "target"
              },
              fields: [
                [
                  {
                    name: "Elapsed Time",
                    value: durationStr
                  },
                // ],
                // [
                  {
                    name: "Logged Member",
                    value: hyperlink(
                      guildMember.user.tag,
                      `https://discord.com/users/${guildMember.user.id}`
                    )
                  }
                ],
                [
                  {
                    name: "Member Mention",
                    value: mentionFuncs.userMention(
                      guildMember.user.id,
                      { showID: true }
                    )
                  },
                // ],
                // [
                  {
                    name: "Role",
                    value: mentionFuncs.roleMention(
                      role.id,
                      { showID: true }
                    )
                  }
                ],
                [
                  {
                    name: "Guild",
                    value: mentionFuncs.guildMention(
                      guild.name,
                      guild.id,
                      { showID: true }
                    )
                  },
                  // {
                  //   name: "Channel",
                  //   value: mentionFuncs.channelMention(
                  //     reaction.message.channel.id,
                  //     { showID: true }
                  //   )
                  // },
                  {
                    name: "Message",
                    value: mentionFuncs.messageMention(
                      reaction.message.url,
                      { showID: true }
                    )
                  }
                ]
              ]
            }
          ]
        }
      )
      await addedMessage.execute()
    }

    // if admin, cycle through reactions on this post
    //  for each reaction, cycle through users who reacted
    //   for each user, assign the role, just in case
    // Get list of roles
    if (false) {
      let rolesDB = {}
      let dbRes = await dbFuncs.getDB(
        guild.id,
        "roles"
      )
      rolesDB = dbRes[0]
      let newMessages = dbRes[1]
      messages = messages.concat(newMessages)

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
              let thisMember = await getters.getCachedMember(client, guild, thisUser.id)
              if (thisMember) {
                // If this user doesn't have this role
                let thisRole = rrs[message.id][rName]
                if (typeof thisRole == "object") {
                  thisRole = thisRole["role"]
                }
                // messages.push(`      Ro: ${thisRole}`)
                thisRole = await getters.getCachedRole(client, guild, thisRole)
                if (thisRole) {
                  if (! await getters.getCachedRole(client, thisMember, thisRole.name)) {
                    thisMember.roles.add(thisRole)
                  }
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
