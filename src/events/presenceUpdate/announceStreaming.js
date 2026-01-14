// @ts-nocheck

// VoiceState
// Formatters: inlineCode, italic
const { Presence, ActivityType, inlineCode, bold, italic, hyperlink } = require('discord.js')
// Rook-branded Client
const { RookClient } = require('../../classes/objects/rclient.class')
// Rook-branded Embed
const { RookEmbed } = require('../../classes/embed/rembed.class')
const fileFuncs = require('../../utils/fs/fileFuncs')

/**
 * Logs edited messages from the server.
 * @param {RookClient}  client
 * @param {Presence}    oldPresence
 * @param {Presence}    newPresence
 */
module.exports = async (client, oldPresence, newPresence) => {
  let result = false
  let messages = []

  let hadStreaming = false
  let hasStreaming = false
  let oldStream = null
  let newStream = null

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
    for (let activity of newPresence.activities) {
      if (activity) {
        if ([
          ActivityType.Streaming,
          ActivityType.Watching
        ].indexOf(activity?.type) > -1) {
          let oldActivity = {
            name: activity?.name,
            type: activity?.type,
            url: activity?.url,
            details: activity?.details,
            state: activity?.state,
            createdTimestamp: activity?.createdTimestamp
          }
          oldStream = oldActivity.createdTimestamp
          oldActivities.push(oldActivity)
          hadStreaming = true
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
          ActivityType.Watching
        ].indexOf(activity?.type) > -1) {
          let newActivity = {
            name: activity?.name,
            type: activity?.type,
            url: activity?.url,
            details: activity?.details,
            state: activity?.state,
            createdTimestamp: activity?.createdTimestamp
          }
          newStream = newActivity.createdTimestamp
          newActivities.push(newActivity)
          hasStreaming = true
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
      console.log(thisPresence)
    }
  }

  let foundActivity = null
  if (newPresence.activities) {
    for (let activity of newPresence.activities) {
      if (activity.type == ActivityType.Streaming) {
        if (activity.url) {
          foundActivity = activity
        }
      }
    }
  }

  if (
    (!hadStreaming) &&
    hasStreaming &&
    foundActivity
  ) {
    const guild = await newPresence.guild
    if (!guild) {
      messages.push(`${client.profile.emojis.fail} No Guild`)
      return [result, messages]
    }

    const member = await newPresence.member
    if (!member) {
      messages.push(`${client.profile.emojis.fail} No Member`)
      return [result, messages]
    }

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

    let guildID = member.guild.id
    const guildChannels = fileFuncs.getAFile(
      [
        "src",
        "dbs",
        guildID
      ],
      "channels.json"
    )
    if (!guildChannels) {
      messages.push(`${client.profile.emojis.fail} Failed to fetch Guild Channels for '${fetchedMember.guild.name}' [${fetchedMember.guild.id}]`)
      return [result, messages]
    }

    let destChannelID = guildChannels["stream-alerts"]

    if (!destChannelID) {
      messages.push(`${client.profile.emojis.fail} Stream Alerts channel not found for '${member.guild.name}' [${member.guild.id}]`)
      return [result, messages]
    }

    let destChannel = await guild?.channels.fetch(destChannelID)
    if (!destChannel) { return [false, []] }

    let this_package = { embeds: [ embed ] }
    result = await destChannel.send(this_package)

    messages.push(
      "🔴 " +
      JSON.stringify(
        {
          guild: member.guild.name,
          member: member.user.tag,
          url: foundActivity.url
        }
      )
    )
  }

  return [result, messages]
}
