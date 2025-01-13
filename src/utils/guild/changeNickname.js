const { inlineCode, italic } = require('discord.js')
const randFuncs = require('./primitives/randFuncs') // Random Functions
const path = require('path')                    // Easy path management
const fs = require('fs')                        // Filesystem manipulation

// Main function to compare commands
module.exports = (client, member) => {
  changeNickname(client, member)
}

let namesDB = {}

function normalName() {
  let newNickname = ""

  if (namesDB.parts?.names) {
    newNickname = randFuncs.randPick(namesDB.parts.names)
  }

  return newNickname
}
function weightedName() {
  let newNickname = ""

  let totalWeight = 0
  let newWeights = []
  let weights = Object.entries(namesDB.weights)
  weights.sort((a, b) => b[1] - a[1])
  let rsortWeights = Object.fromEntries(weights)

  for (let [wLabel, wAmount] of Object.entries(rsortWeights)) {
    totalWeight += wAmount
    newWeights.push([wLabel, totalWeight])
  }

  let weightFlip = randFuncs.myRand(0, totalWeight)

  let chosen = false
  for (let wData of newWeights) {
    if (chosen) {
      break
    }
    if (weightFlip <= wData[1]) {
      newNickname = randFuncs.randPick(namesDB.parts[wData[0]])
      chosen = true
    }
  }

  return newNickname
}
function buildName() {
  let newNickname = ""

  let goodFlip = false

  // Add Pre
  if (namesDB.parts?.pre && namesDB.parts.pre.length > 0) {
    // Flip a coin
    goodFlip = randFuncs.roll(2)
    // If success, add Pre
    if (goodFlip) {
      newNickname += randFuncs.randPick(namesDB.parts.pre) + " "
    }
  }

  // Add Name
  newNickname += randFuncs.randPick(namesDB.parts.names) + " "

  // Add Post
  if (namesDB.parts?.post && namesDB.parts.post.length > 0) {
    // Flip a coin
    goodFlip = randFuncs.roll(2)
    // If success, add Post
    if (goodFlip) {
      newNickname += randFuncs.randPick(namesDB.parts.post) + " "
    }
  }

  // Add Suffix
  if (namesDB.parts?.suffix && namesDB.parts.suffix.length > 0) {
    newNickname = newNickname.trim()
    // Flip a coin
    goodFlip = randFuncs.roll(2)
    // If success, add Suffix
    if (goodFlip) {
      newNickname += ", " + randFuncs.randPick(namesDB.parts.suffix)
    }
  }

  return newNickname
}

async function selectMember(member) {
  let oldNickname = member.displayName
  let newNickname = member.displayName
  let messages = []
  let namesPath = path.join(
    __dirname,
    "..",
    "dbs",
    "nicknames",
    member.id
  )
  if (!fs.existsSync(namesPath + ".json")) {
    messages.push(
      `No name options found for '${member.user.tag}'`
      // + `[${inlineCode(member.id)}]`
    )
    return [newNickname, messages]
  }

  namesDB = require(namesPath)

  switch(namesDB.mode) {
    case "weighted":
      newNickname = weightedName()
      break
    case "build":
      newNickname = buildName()
      break
    default:
      newNickname = normalName()
      break
  }

  if ("prefixes" in namesDB) {
    if (member.guild.id in namesDB.prefixes) {
      newNickname = `${namesDB.prefixes[member.guild.id].prefix}${newNickname}`
    }
  }

  if ((oldNickname == newNickname) || (newNickname.length > 32)) {
    messages.push(`Attempted to change '${member.user.tag}' in '${member.guild.name}' to: '${newNickname}' [${newNickname.length}]`)
    let newMessages = []
    [newNickname, newMessages] = await selectMember(member)
    messages = messages.concat(newMessages)
  }

  return [newNickname, messages]
}

// Function to change a member's nickname
async function changeNickname(client, member) {
  let clientMember = null
  let success = false
  let messages = []

  if (!member) {
    success = false
    messages.push(`No Member sent.`)

    return {
      success: success,
      message: messages
    }
  }

  if (!client?.guilds) {
    success = false
    messages.push(`Couldn't load Client Guilds.`)

    return {
      success: success,
      message: messages
    }
  }

  if (member.guild.ownerId === member.id) {
    success = false
    messages.push(`Can't adjust nickname. ${member} is Guild Owner of ${italic(member.guild.name)} [${inlineCode(member.guild.id)}].`)

    return {
      success: success,
      message: messages
    }
  }

  // Get Guild ID
  let guildID = member.guild.id
  // Get Guild Data
  let guildData = client.guilds.cache.get(guildID)

  // Get Client User from This Guild
  clientMember = guildData.members.me
  const memberPos = await member.roles.highest.position
  const clientPos = await clientMember.roles.highest.position
  if (memberPos >= clientPos) {
    success = false
    messages.push(`${client.profile.emojis.fail} Can't adjust nickname. Role position of ${member} is greater than or equal to ${clientMember} in ${italic(guildData.name)} [${inlineCode(guildID)}].`)

    return {
      success: success,
      message: messages
    }
  }

  messages.push(`${client.profile.emojis.check} ${clientMember} changing nickname of '${member.user.tag}' in ${italic(guildData.name)} [${inlineCode(guildID)}].`)

  let oldNickname = member.displayName
  let newNickname = member.displayName
  let newMessages = []

  [newNickname, newMessages] = await selectMember(member)
  newNickname = newNickname.trim()

  messages = messages.concat(newMessages)

  if (newNickname == "") {
    success = false
    messages.push(`${client.profile.emojis.fail} Failed to adjust nickname. No nickname choices for '${member.user.tag}'.`)

    return {
      success: success,
      message: messages
    }
  }

  if (oldNickname == newNickname) {
    success = false
    messages.push(`${client.profile.emojis.fail} Failed to adjust nickname. No new nickname generated for '${member.user.tag}'.`)

    return {
      success: success,
      message: messages
    }
  }

  // Get User from This Guild
  let guildMember = await guildData?.members?.fetch(member.id)

  try {
    // Set new nickname
    await guildMember.setNickname(newNickname)
    success = true
    messages.push(
      // `🟩${italic(guildData.name)}: ` +
      `${client.profile.emojis.check} ${clientMember} changed target nickname to ${italic(newNickname)}.`
    )
  } catch(error) {
    success = false
    messages.push(
      // `🟥${italic(guildData.name)}: ` +
      `${client.profile.emojis.fail} ${clientMember} failed to change target nickname. Error: ${italic(error.message)}`
    )
    // console.log(
    //   {
    //     guild: guildData.name,
    //     guildID: guildID,
    //     newNickname: newNickname,
    //     target: JSON.stringify(guildMember.permissions.toArray().sort()),
    //     clientUser: JSON.stringify(clientMember.permissions.toArray().sort())
    //   }
    // )
  }
  return {
    success: success,
    message: messages
  }
}

module.exports = { changeNickname }
