// @ts-nocheck
const { GuildMember, bold } = require('discord.js')
const { RookClient } = require('../../classes/objects/rclient.class')
const { RookEmbed } = require('../../classes/embed/rembed.class')
const mentionFuncs = require('../../utils/formatters/mentions')
const fileFuncs = require('../../utils/fs/fileFuncs')
const dbFuncs = require('../../utils/db/dbFuncs')
const getters = require('../../utils/guild/getters')

/**
 * @param {RookClient} client
 * @param {GuildMember} oldMember
 * @param {GuildMember} newMember
 */
module.exports = async (client, oldMember, newMember) => {
  let result = false
  let messages = []

  let boostRoleID = newMember.guild.roles.premiumSubscriberRole?.id
  if (!boostRoleID) {
    // DB
    let dbRes = await dbFuncs.getDB(
      newMember.guild.id,
      "roles"
    )
    let roleNames = dbRes[0]
    let messages = dbRes[1]
    // /DB

    if (!roleNames) {
      return [false, []]
    }

    let boostRoleNames = roleNames?.booster
    if (!boostRoleNames) {
      return [false, []]
    }
    if (boostRoleNames.length < 1) {
      return [false, []]
    }

    let boostRole = await getters.getCache(client, newMember.guild, "roles", roleNames.booster[0])
    if (!boostRole) {
      return [false, []]
    }

    boostRoleID = boostRole?.id
  }

  if (!boostRoleID) {
    messages.push(`${client.profile.emojis.fail} Failed to get Boost Role ID for '${newMember.guild.name}'!`)
    return [result, messages]
  }

  let hadBoost = await oldMember.roles.cache.has(boostRoleID)
  let hasBoost = await newMember.roles.cache.has(boostRoleID)

  if ((!hadBoost) && hasBoost) {
    let heartContainerEmoji = await getters.getCache(client, newMember.guild, "emojis", "heartcontainer")
    if (heartContainerEmoji) {
      let msg = {
        name: newMember.displayName,
        avatar: newMember.displayAvatarURL({ size: 128 }),
        guild: {
          name: newMember.guild.name,
          boosts: newMember.guild.premiumSubscriptionCount
        },
        footer: {
          image: heartContainerEmoji?.imageURL({ size: 128 })
        }
      }
      msg.msg = [
        `${bold(msg.guild.name)} currently has ${bold(msg.guild.boosts)} boosts!`,
        "",
        `Thank you for boosting! ${heartContainerEmoji}`
      ]

      // messages.push(
      //   `${newMember.displayName} is boosting '${newMember.guild.name}'!`,
      //   msg
      // )

      let userEntity = {
        name: msg.name,
        avatar: msg.avatar
      }
      let embed = new RookEmbed(
        client,
        {
          title: { text: "<NONE>" },
          color: "#f47fff",
          description: msg.msg,
          playerTypes: { user: "user", target: "target" },
          players: {
            user: userEntity,
            target: userEntity
          },
          footer: {
            text: `${msg.name} Boosted the server :)`,
            image: msg.footer.image
          }
        }
      )

      // Fetch the log channel using its ID
      const guildID = newMember.guild.id
      let guildChannels = null
      [guildChannels, messages] = await dbFuncs.getDB(
        guildID,
        "channels"
      )
      if (!guildChannels) {
        messages.push(`${client.profile.emojis.fail} Failed to fetch Guild Channels for ${mentionFuncs.guildMention(newMember.guild.name, newMember.guild.id, { showID: true, oneLine: true, textOnly: true })}`)
        return [result, messages]
      }

      let log_type = "logging"
      let log_check = "logging-boosts"
      if (log_check in guildChannels) {
        log_type = log_check
      }
      const logChannel = await getters.getCache(client, client, "channels", guildChannels[log_type])

      // Send the embed to the log channel, if found and valid
      if (logChannel) {
        // @ts-ignore
        result = await logChannel.send({ embeds: [ embed.toJSON() ] })
      } else {
        messages.push(`${client.profile.emojis.warning} Log channel not found.`)
        return [result, messages]
      }
    }
  }

  return [result, messages]
}
