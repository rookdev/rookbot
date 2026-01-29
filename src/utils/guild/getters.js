const numFuncs = require("../../utils/primitives/numFuncs")
const dbFuncs = require('../../utils/db/dbFuncs')

async function searchCache(cacheType, collection, cacheID) {
  let ret = null
  // If it's a number
  if (numFuncs.myIsNumeric(cacheID)) {
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
    return null
  }

  let collection = null

  if (cacheType == "channels") {
    cacheTest = cacheTest ?? [ this.channelName ]
    collection = await parent.channels
  } else if (cacheType == "emojis") {
    cacheTest = cacheTest ?? null
    collection = await parent.emojis
  } else if (cacheType == "guilds") {
    cacheTest = cacheTest ?? null
    collection = await client.guilds
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
  
  if (!cacheTest) {
    return null
  }

  if (!collection) {
    return null
  }

  if (typeof cacheTest != "object") {
    cacheTest = [ cacheTest ]
  }

  let guild = parent
  if (parent?.guild) {
    guild = parent.guild
  }
  if (!guild) {
    guild = client.guild
  }
  let guildID = guild?.id
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
    let newMessages = dbRes[1]
    messages = messages.concat(newMessages)

    if (!cacheIDs) {
      if (![
        "emojis",
        "guilds",
        "members",
        "messages",
        "users"
      ].includes(cacheType)) {
        console.log(`${cacheType.ucfirst()} IDs not found for '${guild.name}' [${guild.id}]`)
      }
    } else {
      for (let cacheID of cacheTest) {
        if (ret) {
          continue
        }
        if (Object.keys(cacheIDs).includes(cacheID)) {
          cacheID = cacheIDs[cacheID]
        }
        ret = await this.searchCache(cacheType, collection, cacheID)
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
        ret = await collection.fetch({ user: ret.id, force: true }).first()
        break
      case "emojis":
        ret = cacheTest[0]
        break
    }
  }

  return ret
}

module.exports = {
  searchCache,
  getCache
}
