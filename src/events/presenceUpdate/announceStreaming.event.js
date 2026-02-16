// @ts-nocheck

const { ActivityType, GuildMember, bold, italic, hyperlink } = require('discord.js')
const { EventScript } = require('../../classes/event/eventscript.class')
const { RookClient } = require('../../classes/objects/rclient.class')
const mentionFuncs = require('../../utils/formatters/mentions')
const timeFormat = require('../../utils/formatters/timeFormat')
const dbFuncs = require('../../utils/db/dbFuncs')
const getters = require('../../utils/guild/getters')
const moment = require('moment')

/**
 * @class
 * @this {AnnounceStreamingEvent}
 * @public
 */
module.exports = class AnnounceStreamingEvent extends EventScript {
  constructor(client) {
    let evtprops = {
      name: "announceStreaming",
      event: "presenceUpdate",
      label: "Announce Streaming",
      description: "Log to a channel when a member streams"
    }
    super(
      client,
      {...evtprops}
    )
  }

  /**
   * 
   * @param {RookClient}  client 
   * @param {Presence}    oldPresence 
   * @param {Presence}    newPresence 
   * @returns 
   */
  async action(client, oldPresence, newPresence) {
    // this.messages.push(`/${this.name}: Event Action`)

    let wasStreaming = false
    let isStreaming = false
    let oldStream = null
    let newStream = null
    let sendAlert = false
    let sendDebug = false
    let roles = {}

    let checkStreaming = false
    let showDebug = false

    if (
      oldPresence &&
      newPresence &&
      (["idle","dnd","offline"].indexOf(oldPresence.status) < 0) &&
      (["idle","dnd","offline"].indexOf(newPresence.status) < 0)
    ) {
      checkStreaming = true
    }

    if (checkStreaming) {
      // This Presence
      let thisPresence = null
      thisPresence = {
        guild: {
          name: newPresence.guild.name
        },
        userId: newPresence.userId,
        user: {
          displayName: newPresence.user.displayName
        },
        status: newPresence.status,
        oldStream: null,
        newStream: null,
        newActivities: [],
        oldActivities: []
      }

      // Old Presence
      let oldActivities = []
      for (let activity of oldPresence.activities) {
        if (activity) {
          if ([
            ActivityType.Streaming,
            // ActivityType.Watching
          ].indexOf(activity?.type) > -1) {
            let oldActivity = {
              name: activity?.name,
              typeID: activity?.type,
              type: activity?.type ? ActivityType[activity.type] : "",
              url: activity?.url,
              details: activity?.details,
              state: activity?.state,
              createdTimestamp: activity?.createdTimestamp
            }
            oldStream = oldActivity.createdTimestamp
            oldActivities.push(oldActivity)
            wasStreaming = true
            showDebug = true
          }
        }
      }

      // New Presence
      let newActivities = []
      for (let activity of newPresence.activities) {
        if (activity) {
          if ([
            ActivityType.Streaming,
            // ActivityType.Watching
          ].indexOf(activity?.type) > -1) {
            let newActivity = {
              name: activity?.name,
              typeID: activity?.type,
              type: activity?.type ? ActivityType[activity.type] : "",
              url: activity?.url,
              details: activity?.details,
              state: activity?.state,
              createdTimestamp: activity?.createdTimestamp
            }
            newStream = newActivity.createdTimestamp
            newActivities.push(newActivity)
            isStreaming = true
            showDebug = true
          }
        }
      }

      thisPresence.oldStream = oldStream
      thisPresence.newStream = newStream
      thisPresence.oldActivities = oldActivities
      if (oldStream != newStream) {
        thisPresence.newActivities = newActivities
      }
      if (showDebug) {
        // this.messages.push(JSON.stringify(thisPresence))
      }
    }

    if (!wasStreaming && !isStreaming) {
      return false
    }

    let foundActivity = null
    if (newPresence.activities) {
      for (let activity of newPresence.activities) {
        if (activity.type == ActivityType.Streaming) {
          if (activity?.url) {
            foundActivity = activity
          }
        }
      }
    }

    let guildID = newPresence.guild.id

    let stoppedStreaming = wasStreaming && !isStreaming
    let guildRoles = null

    let member = await getters.getCache(client, newPresence.guild, "members", newPresence.user.id)

    if (stoppedStreaming) {
      if (!roles?.removed) {
        roles.removed = []
      }
      // Check owner
      if (!guildRoles) {
        // DB
        let dbRes = await dbFuncs.getDB(
          guildID,
          "roles"
        )
        guildRoles = dbRes[0]
        let newMessages = dbRes[1]
        // messages = messages.concat(newMessages)
        // /DB
      }
      let OWNER_ROLES = guildRoles["owner"] ?? null
      if (OWNER_ROLES) {
        let hasOwner = await member.roles.cache.some(r=>OWNER_ROLES.includes(r.name))
        if (hasOwner) {
          sendDebug = true
          // Check owner streaming
          let OWNER_STREAMING_ROLES = guildRoles["streaming-owner"] ?? null
          if (OWNER_STREAMING_ROLES) {
            if (await member.roles.cache.some(r=>OWNER_STREAMING_ROLES.includes(r.name))) {
              for (let roleName of OWNER_STREAMING_ROLES) {
                let role = await getters.getCache(client, oldPresence.guild, "roles", roleName)
                if (role) {
                  roles.removed.push(roleName)
                  await member.roles.remove(role)
                }
              }
            }
          }
        }
      }

      // Check member streaming
      let STREAMING_ROLES = guildRoles["streaming-member"] ?? null
      if (STREAMING_ROLES) {
        let isStreamer = await member.roles.cache.some(r=>STREAMING_ROLES.includes(r.name))
        if (isStreamer) {
          sendDebug = true
          for (let roleName of STREAMING_ROLES) {
            let role = await getters.getCache(client, oldPresence.guild, "roles", roleName)
            if (role) {
              roles.removed.push(roleName)
              await member.roles.remove(role)
            }
          }
        }
      }
    }
    if (!wasStreaming && isStreaming) {
      // Check owner
      if (!roles?.added) {
        roles.added = []
      }
      if (!guildRoles) {
        // DB
        let dbRes = await dbFuncs.getDB(
          guildID,
          "roles"
        )
        guildRoles = dbRes[0]
        let newMessages = dbRes[1]
        // messages = messages.concat(newMessages)
        // /DB
      }
      let OWNER_ROLES = guildRoles["owner"] ?? null
      if (OWNER_ROLES) {
        let hasOwner = await member.roles.cache.some(r=>OWNER_ROLES.includes(r.name))
        if (hasOwner) {
          sendAlert = true
          // Check owner streaming
          let OWNER_STREAMING_ROLES = guildRoles["streaming-owner"] ?? null
          if (OWNER_STREAMING_ROLES) {
            for (let roleName of OWNER_STREAMING_ROLES) {
              let role = await getters.getCache(client, newPresence.guild, "roles", roleName)
              if (role) {
                roles.added.push(roleName)
                await member.roles.add(role)
              }
            }
          }
        }
      }
      // Check member streaming
      let STREAMING_ROLES = guildRoles["streaming-member"] ?? null
      let STREAMER_ROLES = guildRoles["stream-team"] ?? null
      if (STREAMING_ROLES) {
        let isStreamer = true
        if (STREAMER_ROLES) {
          isStreamer = false
          isStreamer = await member.roles.cache.some(r=>STREAMER_ROLES.includes(r.name))
        }
        if (isStreamer) {
          sendAlert = true
          for (let roleName of STREAMING_ROLES) {
            let role = await getters.getCache(client, newPresence.guild, "roles", roleName)
            if (role) {
              roles.added.push(roleName)
              await member.roles.add(role)
            }
          }
        }
      }
    }

    if (
      (!wasStreaming) &&
      isStreaming &&
      foundActivity
    ) {
      const guild = await newPresence.guild
      if (!guild) {
        this.messages.push(`${client.profile.emojis.fail} No Guild`)
        return false
      }

      const member = await newPresence.member
      if (!member) {
        this.messages.push(`${client.profile.emojis.fail} No Member`)
        return false
      }

      if (sendAlert) {
        let props = {
          title: {
            text: "🔴Go Live!🔴"
          },
          playerTypes: {
            user: "guild",
            target: "target"
          },
          players: {
            user: {
              name: member.guild.name,
              avatar: member.guild.iconURL({ size: 128 })
            },
            target: {
              name: member.displayName,
              avatar: member.displayAvatarURL({ size: 128 })
            }
          }
        }
        props.description = []
        props.description.push(`${member} has started streaming!`)
        props.description.push(bold(foundActivity.name))
        if (foundActivity.details) {
          props.description.push(italic(foundActivity.details))
        }
        props.description.push(`Watch them online ${hyperlink('here',foundActivity.url)}!`)

        let embed = new RookEmbed(client, props)

        let guildChannels = null

        // DB
        let dbRes = await dbFuncs.getDB(
          guildID,
          "channels"
        )
        guildChannels = dbRes[0]
        this.messages.push(...dbRes[1])
        // /DB

        if (!guildChannels) {
          this.messages.push(`${client.profile.emojis.fail} Failed to fetch Guild Channels for ${mentionFuncs.guildMention(member.guild.name, member.guild.id, { showID: true, oneLine: true, textOnly: true })}`)
          return false
        }

        let destChannelID = guildChannels["stream-alerts"]

        if (!destChannelID) {
          this.messages.push(`${client.profile.emojis.fail} Stream Alerts channel not found for ${mentionFuncs.guildMention(member.guild.name, member.guild.id, { showID: true, oneLine: true, textOnly: true })}`)
          return false
        }

        let destChannel = await getters.getCache(client, guild, "channels", destChannelID)
        if (!destChannel) { return false }

        let this_package = { embeds: [ embed ] }
        let result = await destChannel.send(this_package)
      }
    }

    if (sendAlert) {
      // appended messages for debugging
      await this.logMessages(
        "🔴",
        {
          guild: member.guild.name,
          member: member.user.tag,
          url: foundActivity.url,
          roles: roles
        }
      )
    }
  }
}
