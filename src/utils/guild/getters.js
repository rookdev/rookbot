const mentionFuncs = require('../../utils/formatters/mentions')
const numFuncs = require("../../utils/primitives/numFuncs")
const dbFuncs = require('../../utils/db/dbFuncs')

async function searchCache(cacheType, collection, cacheID) {
  let ret = null
  // If it's a number
  if (
    (collection) &&
    (collection?.client) &&
    (collection?.client?.platform) &&
    (["discord"].includes(collection.client.platform) && numFuncs.myIsNumeric(cacheID)) ||
    (["stoat"].includes(collection.client.platform) && cacheID.replaceAll(" ", "").toUpperCase() == cacheID)
  ) {
    if (
      [
        "channels",
        "guilds",
        "users"
      ].includes(cacheType)) {
      ret = await collection.cache.get(cacheID)
    } else {
      // Search for item by ID
      ret = await collection.fetch(cacheID)
    }
  } else if (typeof cacheID == "string") {
    // Search for item by Name
    ret = await collection.cache.find(
      item => 
        item?.name === cacheID ||               // global
        item?.name === `:${cacheID}:` ||        // emoji
        item?.nickname === cacheID ||           // member
        item?.user?.displayName === cacheID ||  // user
        item?.user?.globalName === cacheID ||   // user
        item?.user?.tag === cacheID ||          // user
        item?.user?.username === cacheID        // user
    )
  }

  return ret
}
async function getCache(client, parent, cacheType, cacheTest) {
  let messages = []
  if (!parent) {
    console.log(`No parent: ${cacheType} : ${cacheTest}`)
    return null
  }

  let collection = null

  if (cacheType == "channels") {
    cacheTest = cacheTest ?? null
    collection = await parent.channels
  } else if (cacheType == "emojis") {
    cacheTest = cacheTest ?? null
    collection = await parent.emojis
  } else if (cacheType == "guilds") {
    cacheTest = cacheTest ?? null
    collection = await getProp(client, client, "guilds")
  } else if (cacheType == "members") {
    cacheTest = cacheTest ?? null
    collection = await parent.members
  } else if (cacheType == "messages") {
    cacheTest = cacheTest ?? null
    collection = await parent.messages
  } else if (cacheType == "roles") {
    cacheTest = cacheTest ?? null
    collection = await parent.roles
  } else if (cacheType == "users") {
    cacheTest = cacheTest ?? null
    collection = await client.users
  }

  if ((!cacheTest) || (cacheTest == null) || (cacheTest == "null")) {
    return null
  }

  if (!collection) {
    return null
  }

  if (typeof cacheTest !== "object") {
    cacheTest = [ cacheTest ]
  }

  let guild = parent
  if (guild) {
    // console.log(
    //   `Cache1: ${guild.name} [${guild.id}]`
    // )
  }
  if (!guild) {
    guild = await getGuild(client, parent)
  }
  if (guild) {
    // console.log(
    //   `Cache2: ${guild.name} [${guild.id}]`
    // )
  }
  if (!guild) {
    guild = client.guild
  }
  if (guild) {
    // console.log(
    //   `Cache3: ${guild.name} [${guild.id}]`
    // )
  }
  let guildID = guild?.id ?? client.guildID
  let ret = null
  let cacheIDs = null

  for (let cacheID of cacheTest) {
    if (ret) {
      continue
    }
    ret = await searchCache(cacheType, collection, cacheID)
  }

  if (!ret) {
    let dbRes = await dbFuncs.getDB(
      guildID,
      cacheType
    )
    cacheIDs = dbRes[0]
    messages.push(...dbRes[1])

    if (!cacheIDs) {
      if (![
        "emojis",
        "guilds",
        "members",
        "messages",
        "users"
      ].includes(cacheType)) {
        messages.push(`${cacheType.ucfirst()} IDs not found for ${mentionFuncs.guildMention(guild.name, guild.id, { showID: true, oneLine: true })}`)
      }
    } else {
      for (let cacheID of cacheTest) {
        if (ret) {
          continue
        }
        if (Object.keys(cacheIDs).includes(cacheID)) {
          cacheID = cacheIDs[cacheID]
        }
        ret = await searchCache(cacheType, collection, cacheID)
      }
    }
  }

  if (ret?.partial) {
    ret = await ret.fetch()
  }

  if (!ret) {
    switch(cacheType) {
      case "members":
      case "users":
        if (numFuncs.myIsNumeric(cacheTest[0])) {
          ret = await collection.fetch({ user: cacheTest[0], force: true })
        } else {
          ret = cacheTest[0]
        }
        break
      case "emojis":
        ret = cacheTest[0]
        break
    }
  }

  return ret
}

async function getProp(client, parent, propName) {
  let prop = null

  if (!parent) {
    parent = client
  }

  if (parent[propName]) {
    prop = await parent[propName]
  }

  if (
    (!prop) &&
    [
      "stoat"
    ].includes(client.platform)) {
    propName = propName.replace("guild","server")
    switch(propName) {
      case "user":
        propName = "author"
        break
    }
    if (parent[propName]) {
      prop = await parent[propName]
    }
  }

  return prop
}

async function getCachedChannel(client, guild, channelName) {
  return await getCache(client, guild, "channels", channelName)
}
async function getCachedEmoji(client, guild, emojiName) {
  return await getCache(client, guild, "emojis", emojiName)
}
async function getCachedGuild(client, guildName) {
  return await getCache(client, client, "guilds", guildName)
}
async function getCachedGuilds(client) {
  return await getCache(client, client, "guilds")
}
async function getCachedMember(client, guild, memberName) {
  return await getCache(client, guild, "members", memberName)
}
async function getCachedRole(client, guild, roleName) {
  return await getCache(client, guild, "roles", roleName)
}
async function getCachedUser(client, userName) {
  return await getCache(client, client, "users", userName)
}
async function getCachedUsers(client) {
  return await getCache(client, client, "users")
}
async function getGuild(client, parent) {
  return await getProp(client, parent, "guild")
}

module.exports = {
  searchCache,
  getCache,
  getCachedChannel,
  getCachedEmoji,
  getCachedGuild,
  getCachedGuilds,
  getCachedMember,
  getCachedRole,
  getCachedUser,
  getCachedUsers,
  getGuild,
  getProp
}
