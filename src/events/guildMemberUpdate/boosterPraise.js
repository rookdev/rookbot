// @ts-nocheck
const { GuildMember } = require('discord.js')
const { RookClient } = require('../../classes/objects/rclient.class.js')
const { RookEmbed } = require('../../classes/embed/rembed.class.js')
const path = require('path')
const fs = require('fs')

/**
 * @param {RookClient} client
 * @param {GuildMember} oldMember
 * @param {GuildMember} newMember
 */
module.exports = async (client, oldMember, newMember) => {
  let boostRoleID = newMember.guild.roles.premiumSubscriberRole?.id
  if (!boostRoleID) {
    let rolesPath = path.join(
      __dirname,
      "..",
      "..",
      "dbs",
      newMember.guild.id,
      "roles.json"
    )

    if (fs.existsSync(rolesPath)) {
      let roleNames = require(rolesPath)
      if (!roleNames) {
        return
      }

      let boostRoleNames = roleNames?.booster
      if (!boostRoleNames) {
        return
      }
      if (boostRoleNames.length < 1) {
        return
      }

      let boostRole = await newMember.guild.roles.cache.find(
        r => r.name === roleNames.booster[0]
      )
      if (!boostRole) {
        return
      }

      boostRoleID = boostRole?.id
    }
  }

  if (!boostRoleID) {
    console.log(`Failed to get Boost Role ID for '${newMember.guild.name}'!`)
    return
  }

  let hadBoost = await oldMember.roles.cache.has(boostRoleID)
  let hasBoost = await newMember.roles.cache.has(boostRoleID)

  if ((!hadBoost) && hasBoost) {
    let heartContainerEmoji = newMember.guild.emojis.cache.find(
      e => e.name === "heartcontainer"
    )
    let msg = {
      name: newMember.displayName,
      avatar: newMember.displayAvatarURL({ size: Math.pow(2, 7) }),
      guild: {
        name: newMember.guild.name,
        boosts: newMember.guild.premiumSubscriptionCount
      },
      footer: {
        image: heartContainerEmoji.imageURL({ size: Math.pow(2, 7) })
      }
    }
    msg.msg = [
      `**${msg.guild.name}** currently has **${msg.guild.boosts}** boosts!`,
      "",
      `Thank you for boosting! ${heartContainerEmoji}`
    ]

    // console.log(
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
    const guildChannels = require(`../../dbs/${guildID}/channels.json`)
    let log_type = "logging"
    let log_check = "logging-boosts"
    if (log_check in guildChannels) {
      log_type = log_check
    }
    const logChannel = await client.channels.fetch(guildChannels[log_type])

    // Send the embed to the log channel, if found and valid
    if (logChannel) {
      // @ts-ignore
      await logChannel.send({ embeds: [ embed.toJSON() ] })
    } else {
      console.warn('Log channel not found.')
    }
  }
}
