const { ActivityType } = require("discord.js")
const globalFuncs = require('../primitives/globalFuncs')
const dbFuncs = require('../db/dbFuncs')
const getters = require('./getters')

const detectStreaming = async (
  client,
  eventName,
  scriptName,
  oldObject,
  newObject
) => {
  let wasStreaming = false
  let isStreaming = false
  let updatedStream = false
  let streamerType = []
  let changesDetected = false
  let member = null
  let roles = {}

  let oldGuild = null
  let newGuild = null

  let debug = {
    "event": eventName,
    "script": scriptName,
    "changesDetected": false,
    "messages": []
  }

  if (oldObject) {
    // Add guild's name,
    // Add user's ID
    // Add keys
    debug["old"] = {
      guild: oldObject.guild.name,
      userId: oldObject?.userId ?? oldObject?.id ?? 0,
      keys: Object.keys(oldObject)
    }
  }
  if (newObject) {
    // Add guild's name,
    // Add user's ID
    // Add keys
    debug["new"] = {
      guild: newObject.guild.name,
      userId: newObject?.userId ?? newObject?.id ?? 0,
      keys: Object.keys(newObject)
    }
  }

  if (oldObject && newObject) {
    // presenceUpdate
    if (eventName == "presenceUpdate") {
      // Delete stuff I don't want
      delete debug["old"]["userId"]
      delete debug["new"]["userId"]
      delete debug["old"]["keys"]
      delete debug["new"]["keys"]

      // Change data
      // debug["old"]["userId"] = oldObject.user.id
      // debug["new"]["userId"] = newObject.user.id

      // Add member's name
      debug["old"]["member"] = await oldObject.user.tag
      debug["new"]["member"] = await newObject.user.tag
      member = newObject.member
      // If member's not idle, dnd, offline
      if (
        (["idle","dnd","offline"].indexOf(oldObject?.status) < 0) &&
        (["idle","dnd","offline"].indexOf(newObject?.status) < 0)
      ) {
        let oldStream = null
        let newStream = null
        // Add activity data
        let oldActivities = []
        let newActivities = []
        for (let activity of oldObject?.activities) {
          if (activity) {
            if (activity.type == ActivityType.Streaming) {
              wasStreaming = true
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
            }
          }
        }
        for (let activity of newObject?.activities) {
          if (activity) {
            if (activity.type == ActivityType.Streaming) {
              isStreaming = true
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
            }
          }
          debug["old"]["activity"] = oldActivities
          debug["new"]["activity"] = newActivities
        }
        debug["oldStream"] = oldStream
        debug["newStream"] = newStream
        updatedStream = oldStream != newStream
      }
      debug["old"] = JSON.stringify(debug["old"])
      debug["new"] = JSON.stringify(debug["new"])
    }
    // voiceStateUpdate
    if (eventName == "voiceStateUpdate") {
      wasStreaming  = oldObject.streaming
      isStreaming   = newObject.streaming

      // Delete stuff I don't want
      delete debug["old"]["userId"]
      delete debug["new"]["userId"]
      delete debug["old"]["keys"]
      delete debug["new"]["keys"]

      // Change data
      // debug["old"]["userId"] = oldObject.member.id
      // debug["new"]["userId"] = newObject.member.id

      // Add member's name
      member = newObject.member
      debug["old"]["member"] = oldObject.member.user.tag
      debug["new"]["member"] = newObject.member.user.tag
      // Add channel's name
      if (oldObject.channelId) {
        oldGuild = await getters.getGuild(client, oldObject)
        let channel = await getters.getCachedChannel(client, oldGuild, oldObject.channelId)
        debug["old"]["channel"] = channel?.name
      }
      if (newObject.channelId) {
        newGuild = await getters.getGuild(client, newObject)
        let channel = await getters.getCachedChannel(client, newGuild, newObject.channelId)
        debug["new"]["channel"] = channel?.name
      }
      debug["old"] = JSON.stringify(debug["old"])
      debug["new"] = JSON.stringify(debug["new"])
    }

    // Streaming statuses
    debug["wasStreaming"]       = wasStreaming
    debug["isStreaming"]        = isStreaming
    debug["updatedStream"]      = updatedStream
    debug["startedStreaming"]   = !wasStreaming && isStreaming
    debug["stoppedStreaming"]   = wasStreaming && !isStreaming
    debug["disconnectedVoice"]  = false
    if (eventName == "voiceStateUpdate") {
      debug["disconnectedVoice"] = wasStreaming && isStreaming && !newObject?.channelId
    }

    changesDetected =
      debug["startedStreaming"] ||
      debug["updatedStream"] ||
      debug["stoppedStreaming"] ||
      debug["disconnectedVoice"]
  }

  debug["changesDetected"] = changesDetected

  let adding = false
  let removing = false
  let rolesMode = ""
  if (changesDetected) {
    // Add roles
    if (
      debug["startedStreaming"] ||
      debug["updatedStream"]
    ) {
      adding = true
      rolesMode = "added"
    }
    // Remove roles
    if (
      debug["stoppedStreaming"] ||
      debug["disconnectedVoice"]
    ) {
      removing = true
      rolesMode = "removed"
    }
    if (!roles[rolesMode]) {
      roles[rolesMode] = []
    }
    let guildRoles = []
    // DB
    let dbRes = await dbFuncs.getDB(
      oldObject.guild.id,
      "roles"
    )
    guildRoles = dbRes[0]
    debug["messages"].push(...dbRes[1])

    // Owner roles
    let OWNER_ROLES = guildRoles["owner"] ?? null
    if (OWNER_ROLES) {
      // Is Owner
      let isOwner = await member.roles.cache.some(r=>OWNER_ROLES.includes(r.name))
      if (isOwner) {
        streamerType.push("streaming-owner")
      }
    }

    // Streamer roles
    let STREAMER_ROLES = guildRoles["stream-team"] ?? null
    // Streaming roles
    let STREAMING_ROLES = guildRoles["streaming-member"] ?? null
    if (STREAMING_ROLES) {
      // Is Stream Team
      let isStreamTeam = true
      if (STREAMER_ROLES) {
        isStreamTeam = false
        isStreamTeam = await member.roles.cache.some(r=>STREAMER_ROLES.includes(r.name))
        if (isStreamTeam) {
          debug["isStreamTeam"] = isStreamTeam
        }
      }
      // Is Streaming Member
      let hasStreaming = await member.roles.cache.some(r=>STREAMING_ROLES.includes(r.name))
      if (
        (isStreamTeam && adding) ||
        (hasStreaming && removing)
      ) {
        streamerType.push("streaming-member")
      }
    }
    debug["streamer-type"] = streamerType
    debug["roles"] = roles

    for (let roleSet of debug["streamer-type"]) {
      if (guildRoles[roleSet]) {
        roles[rolesMode].push(...guildRoles[roleSet])
      }
    }

    for (let roleName of roles[rolesMode]) {
      let hasRole = await member.roles.cache.some(r=>r.name===roleName)
      if (
        (adding && !hasRole) ||
        (removing && hasRole)
      ) {
        let role = await getters.getCachedRole(client, newGuild, roleName)
        if (role) {
          if (adding) {
            await member.roles.add(role)
          }
          if (removing) {
            await member.roles.remove(role)
          }
        }
      }
    }
  }

  if (changesDetected) {
    if (globalFuncs.empty(debug["streamer-type"])) {
      debug["changesDetected"] = false
    }
    if ((!adding) && (!removing)) {
      debug["changesDetected"] = false
    }
    if (rolesMode == "") {
      debug["changesDetected"] = false
    }
  }

  return debug
}

module.exports = detectStreaming
