// @ts-nocheck

const { GuildMember, bold } = require('discord.js')
const { EventScript } = require('../../classes/event/eventscript.class')
const { RookMessage } = require('../../classes/objects/rmessage.class')
const { RookClient } = require('../../classes/objects/rclient.class')
const { RookEmbed } = require('../../classes/embed/rembed.class')
const mentionFuncs = require('../../utils/formatters/mentions')
const globalFuncs = require('../../utils/primitives/globalFuncs')
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
    let numBoosts = guild?.premiumSubscriptionCount ?? 0
    let boostRoleIDs = []
    let boostColor = "#f47fff"
    if (guild.roles.premiumSubscriberRole?.id) {
      boostRoleIDs.push(guild.roles.premiumSubscriberRole.id + "")
      if (guild.roles.premiumSubscriberRole?.colors?.primaryColor) {
        let color = guild.roles.premiumSubscriberRole.colors.primaryColor
        color = ("#" + color.toString(16).toUpperCase())
        boostColor = color
      }
    }

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
    if (boostRoleNames) {
      for (let boostRoleName of boostRoleNames) {
        let boostRole = await getters.getCachedRole(client, guild, boostRoleName)
        if (boostRole) {
          if (boostRole?.id) {
            boostRoleIDs.push(boostRole.id + "")
            if (boostRole?.colors?.primaryColor) {
              let color = boostRole.colors.primaryColor
              color = ("#" + color.toString(16).toUpperCase())
              boostColor = color
            }
          }
        }
      }
    }

    if (globalFuncs.empty(boostRoleIDs)) {
      this.messages.push(`${client.profile.emojis.fail} Failed to get Boost Role ID for ${mentionFuncs.guildMention(newMember.guild.name, newMember.guild.id, { showID: true, oneLine: true, textOnly: true })}`)
      return false
    }

    let hadBoost    = await oldMember.roles.cache.some(r => boostRoleIDs.contains(r.id + ""))
    let hasBoost    = await newMember.roles.cache.some(r => boostRoleIDs.contains(r.id + ""))
    let gotBoost    = (!hadBoost && hasBoost)
    let lostBoost   = (hadBoost && !hasBoost)
    let boostChange = (gotBoost || lostBoost)
    
    if (boostChange) {
      let userEntity = {
        name: newMember.displayName,
        avatar: await newMember.displayAvatarURL({ size: 128 })
      }

      if (gotBoost) {
        let boostEmojiName = "heartcontainer"
        let heartContainerEmoji = await getters.getCachedEmoji(client, guild, boostEmojiName)
        if (heartContainerEmoji == boostEmojiName) {
          heartContainerEmoji = "<3"
        }
        let msg = {
          msg: [
            `${bold(guild.name)} currently has ${bold(numBoosts)} boosts!`,
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
  
        let props = {
          title: { text: "<NONE>" },
          color: boostColor,
          description: msg.msg,
          playerTypes: { user: "target", target: "target" },
          entities: {
            guild: {
              name: guild.name,
              avatar: await guild.iconURL({ size: 128 })
            },
            target: userEntity
          },
          footer: {
            text: `${userEntity.name} boosted the server :)`,
            image: msg?.footer?.image
          }
        }

        let boostChannel = await this.getChannel(client, guild, [ "boost-alerts", "logging-boosts", "logging" ])
        let boostMessage = await new RookMessage(
          client,
          null,
          {
            channelName: boostChannel.id,
            pages: [ props ]
          }
        )
        await boostMessage.execute()
      }

      let logFields = [
        [
          {
            name: "Name",
            value: mentionFuncs.userMention(newMember.id, { showID: true })
          },
          {
            name: "Guild",
            value: mentionFuncs.guildMention(guild.name, guild.id, { showID: true })
          }
        ],
        [
          {
            name: "Had Boost",
            value: hadBoost ? client.profile.emojis.yes : client.profile.emojis.no
          },
          {
            name: "Has Boost",
            value: hasBoost ? client.profile.emojis.yes : client.profile.emojis.no
          }
        ],
        [
          {
            name: "Boosts",
            value: guild.premiumSubscriptionCount
          }
        ]
      ]
      let logProps = {
        playerTypes: { user: "target", target: "target" },
        entities: { target: userEntity },
        fields: logFields
      }
      if (gotBoost) {
        logProps.color = boostColor,
        logProps.title = {
          text: "[Log] Server Boosted",
          emoji: "💗"
        }
      } else if (lostBoost) {
        logProps.color = client.profile.colors.bad,
        logProps.title = {
          text: "[Log] Boost Lost",
          emoji: "💔"
        }
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
        logProps.title.emoji,
        {
          guild: guild.name,
          member: newMember.displayName,
          action: "boosts",
          direction: (gotBoost ? "got" : "lost"),
          level: guild.premiumTier,
          boosts: guild.premiumSubscriptionCount
        }
      )
    }
  }
}
