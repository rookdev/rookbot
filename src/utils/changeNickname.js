const path = require('path')  // Easy path management
const fs = require('fs')      // Filesystem manipulation

function myRand(min=0, max=1) {
  if (min > max) {
    let tmp = min
    min = max
    max = tmp
  }
  return Math.floor(Math.random() * max)
}

function roll(sides=2,dice=1) {
  let result = 0
  for (let i = 0; i < dice; i++) {
    let thisRoll = myRand(sides)
    result += thisRoll
  }
  return result
}

function randPick(input) {
  return input[myRand(0, input.length)]
}

// Main function to compare commands
module.exports = (client, member) => {
  changeNickname(client, member)
}

let namesDB = {}

function normalName() {
  let newNickname = ""

  if (namesDB.parts?.names) {
    newNickname = randPick(namesDB.parts.names)
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

  let weightFlip = myRand(0, totalWeight)

  let chosen = false
  for (let wData of newWeights) {
    if (chosen) {
      break
    }
    if (weightFlip <= wData[1]) {
      newNickname = randPick(namesDB.parts[wData[0]])
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
    goodFlip = roll(2)
    // If success, add Pre
    if (goodFlip) {
      newNickname += randPick(namesDB.parts.pre) + " "
    }
  }

  // Add Name
  newNickname += randPick(namesDB.parts.names) + " "

  // Add Post
  if (namesDB.parts?.post && namesDB.parts.post.length > 0) {
    // Flip a coin
    goodFlip = roll(2)
    // If success, add Post
    if (goodFlip) {
      newNickname += randPick(namesDB.parts.post) + " "
    }
  }

  // Add Suffix
  if (namesDB.parts?.suffix && namesDB.parts.suffix.length > 0) {
    newNickname = newNickname.trim()
    // Flip a coin
    goodFlip = roll(2)
    // If success, add Suffix
    if (goodFlip) {
      newNickname += ", " + randPick(namesDB.parts.suffix)
    }
  }

  return newNickname
}

async function selectMember(member) {
  let oldNickname = member.displayName
  let newNickname = member.displayName
  let namesPath = path.join(
    __dirname,
    "..",
    "dbs",
    "nicknames",
    member.id
  )
  if (fs.existsSync(namesPath + ".json")) {
    namesDB = require(namesPath)
  } else {
    return newNickname
  }

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
      newNickname = `${namesDB.prefixes[member.guild.id]}${newNickname}`
    }
  }

  if ((oldNickname == newNickname) || (newNickname.length >= 32)) {
    newNickname = await selectMember(member)
  }

  return newNickname
}

// Function to change a member's nickname
async function changeNickname(client, member) {
  let clientMember = null
  let success = false
  let message = []

  if (!member) {
    success = false
    message.push(`No Member sent.`)

    return { success: success, message: message }
  }

  if (!client?.guilds) {
    success = false
    message.push(`Couldn't load Client Guilds.`)

    return { success: success, message: message }
  }

  message.push(`${client.user} changing nickname of '${member.user.tag}'.`)

  let guildID = member.guild.id
  let guildData = client.guilds.cache.get(guildID)
  let oldNickname = member.displayName
  let newNickname = ""

  if ([
    "1111517386588307536",  // castIe
    "1017468471669440692",  // lostflake
    "263968998645956608"    // Minnie
  ].includes(member.id)) {
    newNickname = await selectMember(member)
    newNickname = newNickname.trim()
  }

  if (newNickname == "") {
    success = false
    message.push(`No nickname choices for '${member.user.tag}'.`)

    return { success: success, message: message }
  }

  if (oldNickname == newNickname) {
    success = false
    message.push(`No new nickname generated for '${member.user.tag}'.`)

    return { success: success, message: message }
  }

  // Get Client User from This Guild
  clientMember = await guildData?.members?.fetch(client.user.id)
  // Get User from This Guild
  let guildMember = await guildData?.members?.fetch(member.id)

  try {
    // Set new nickname
    await guildMember.setNickname(newNickname)
    success = true
    message.push(`🟩*${guildData.name}*: **${clientMember.displayName}** changed target nickname to *${newNickname}*.`)
  } catch(error) {
    success = false
    message.push(`🟥*${guildData.name}*: **${clientMember.displayName}** failed to change target nickname. Error: *${error.message}*`)
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
    message: message
  }
}

module.exports = { changeNickname }
