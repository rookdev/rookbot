// @ts-nocheck

const { GuildMember, bold } = require('discord.js')
const { EventScript } = require('../../classes/event/eventscript.class')
const { RookMessage } = require('../../classes/objects/rmessage.class')
const { RookClient } = require('../../classes/objects/rclient.class')
const { RookEmbed } = require('../../classes/embed/rembed.class')
const mentionFuncs = require('../../utils/formatters/mentions')
const dbFuncs = require('../../utils/db/dbFuncs')
const getters = require('../../utils/guild/getters')

/**
 * @class
 * @this {BoosterPraiseEvent}
 * @public
 */
module.exports = class BoosterPraiseEvent extends EventScript {
  constructor(client) {
    let evtprops = {
      name: "boosterPraise",
      event: "guildMemberUpdate",
      label: "Praise for Server Booster",
      description: "Log to a channel when a member boosts the server"
    }
    super(
      client,
      {...evtprops}
    )
  }

  /**
   * 
   * @param {RookClient} client 
   * @param {GuildMember} oldMember 
   * @param {GuildMember} newMember 
   * @returns 
   */
  async action(client, oldMember, newMember) {
    // this.messages.push(`/${this.name}: Event Action`)

    let guild = await this.getProp(client, newMember, "guild")
    let boostRoleID = guild.roles.premiumSubscriberRole?.id

    if (!boostRoleID) {
      // DB
      let dbRes = await dbFuncs.getDB(
        guild.id,
        "roles"
      )
      let roleNames = dbRes[0]
      // this.messages.push(...dbRes[1])

      if (!roleNames) {
        this.messages.push("No Role Names!")
        return false
      }

      let boostRoleNames = roleNames?.booster
      if (!boostRoleNames || boostRoleNames?.length < 1) {
        this.messages.push("No Boost Role Names!")
        return false
      }

      let boostRole = await getters.getCachedRole(client, guild, roleNames.booster[0])
      if (!boostRole) {
        // this.messages.push("No Boost Role!")
        return false
      }

      boostRoleID = boostRole?.id

      if (!boostRoleID) {
        this.messages.push(`${client.profile.emojis.fail} Failed to get Boost Role ID for ${mentionFuncs.guildMention(newMember.guild.name, newMember.guild.id, { showID: true, oneLine: true, textOnly: true })}`)
        return false
      }

      let hadBoost = await oldMember.roles.cache.has(boostRoleID)
      let hasBoost = await newMember.roles.cache.has(boostRoleID)

      if (!hadBoost && hasBoost) {
        let boostEmojiName = "heartcontainer"
        let heartContainerEmoji = await getters.getCachedEmoji(client, guild, boostEmojiName)
        if (heartContainerEmoji == boostEmojiName) {
          heartContainerEmoji = "<3"
        }
        let msg = {
          name: newMember.displayName,
          avatar: await newMember.displayAvatarURL({ size: 128 }),
          guild: {
            name: guild.name,
            boosts: guild.premiumSubscriptionCount
          },
          msg: [
            `${bold(guild.name)} currently has ${bold(guild.boosts)} boosts!`,
            "",
            `Thank you for boosting!`
          ]
        }
        if (heartContainerEmoji) {
          if (heartContainerEmoji?.imageURL) {
            msg.footer = { image: heartContainerEmoji?.imageURL({ size: 128 })}
          }
          msg.msg[2] += ` ${heartContainerEmoji}`
        }

        // messages.push(
        //   `${newMember.displayName} is boosting '${newMember.guild.name}'!`,
        //   msg
        // )

        let userEntity = {
          name: msg.name,
          avatar: msg.avatar
        }
        let props = {
          title: { text: "<NONE>" },
          color: "#f47fff",
          description: msg.msg,
          playerTypes: { user: "target", target: "target" },
          entities: {
            target: userEntity
          },
          footer: {
            text: `${msg.name} Boosted the server :)`,
            image: msg?.footer?.image
          }
        }

        let boostChannel = await this.getChannel(client, guild, ["logging-boosts", "logging"])
        let boostMessage = await new RookMessage(
          client,
          null,
          {
            channelName: boostChannel.id,
            pages: [ props ]
          }
        )
        await boostMessage.execute()

        let logFields = [
          [
            {
              name: "Name",
              value: newMember.displayName
            },
            {
              name: "Guild",
              value: guild.name
            },
            {
              name: "Boosts",
              value: guild.premiumSubscriptionCount
            }
          ]
        ]
        let logProps = {
          color: "#f47fff",
          title: {
            text: "[Log] Server Boosted",
            emoji: ""
          },
          playerTypes: { user: "target", target: "target" },
          entities: { target: userEntity },
          fields: logFields
        }

        // client
        // guild
        // logging-<this> guildchannel key
        // embed props
        await this.logPost(
          client,
          guild,
          "boosts",
          logProps
        )

        // appended messages for debugging
        await this.logMessages(
          "💗",
          {
            guild: guild.name,
            member: newMember.displayName,
            action: "boost",
            level: guild.premiumTier,
            boosts: guild.premiumSubscriptionCount
          }
        )
      }
    }
  }
}
