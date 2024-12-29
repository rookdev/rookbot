const path = require('path')  // Easy path management
const fs = require('fs')      // Filesystem manipulation

function myRand(min=0, max=1) {
  return Math.floor(Math.random() * max)
}

function randPick(input) {
  return input[myRand(0, input.length)]
}

// Main function to compare commands
module.exports = (client, member, isDoI) => {
  changeNickname(client, member, isDoI)
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

  message.push(`${client.user} changing nicknames of '${member.user.tag}'.`)

  let namesDB = {}
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

  }

  let guildID = member.guild.id
  let guildData = client.guilds.cache.get(guildID)
  let oldNickname = ""
  let newNickname = ""

  // castIe
  if (member.id == "1111517386588307536") {
    oldNickname = member.displayName

    // Weighted random selection for the nickname
    const randomChoice = Math.random()

    if (randomChoice < 0.7) {  // 70% chance for "topPicks"
      newNickname = randPick(namesDB.topPicks)
    } else if (randomChoice < 0.85) {  // 15% chance for "castleSynonyms"
      newNickname = randPick(namesDB.castleSynonyms)
    } else {  // 15% chance for "meh"
      newNickname = randPick(namesDB.meh)
    }

  } else if (member.id == "1017468471669440692") {
    // lostflake
    newNickname = randPick(namesDB.names)
  }

  if (newNickname == "") {
    success = false
    message.push(`No nickname choices for '${member.user.tag}'.`)

    return { success: success, message: message }
  }

  if ("prefixes" in namesDB) {
    if (guildID in namesDB.prefixes) {
      newNickname = `${namesDB.prefixes[guildID]}${newNickname}`
    }
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
    console.log(
      {
        guild: guildData.name,
        guildID: guildID,
        newNickname: newNickname,
        target: JSON.stringify(guildMember.permissions.toArray().sort()),
        clientUser: JSON.stringify(clientMember.permissions.toArray().sort())
      }
    )
  }
  return {
    success: success,
    message: message
  }
}

module.exports = { changeNickname }
