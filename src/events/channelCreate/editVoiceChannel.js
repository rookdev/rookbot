// @ts-nocheck
// Channel Type
const { ChannelType } = require('discord.js')
// Rook-branded Client
const { RookClient } = require('../../classes/objects/rclient.class')
// Rook-branded Embed
const { RookEmbed } = require('../../classes/embed/rembed.class')
const randFuncs = require('../../utils/randFuncs') // Random Functions
const path = require('path')  // Easier path management
const fs = require('fs')      // Filesystem manipulation

async function selectName(newChannel) {
  let namesDB = null
  let oldName = newChannel.name
  let newName = newChannel.name

  let namesPath = path.join(
    __dirname,
    "..",
    "..",
    "dbs",
    newChannel.guild.id,
    "voiceChannelNames"
  )

  if (fs.existsSync(namesPath + ".json")) {
    namesDB = require(namesPath)
  } else {
    console.log(`No voice channel names found for '${newChannel.guild.name}' (ID ${newChannel.guild.id})`)
    return newName
  }

  let changeName = true
  if (namesDB?.categories) {
    if (namesDB.categories.length > 0) {
      changeName = false
      if (namesDB.categories.includes(newChannel?.parentId)) {
        changeName = true
      }
    }
  }

  if (!changeName) {
    console.log(`'${newChannel.name}' of '${newChannel.guild.name}' not in a specified category`)
    return newName
  }

  if (changeName) {
    let mode = namesDB?.mode ?? "normal"
    newName = ""

    if (mode == "normal") {
      newName += randFuncs.randPick(namesDB.parts.names)
    } else if (mode == "build") {
      let sahaNames = require(path.join(
        __dirname,
        "..",
        "..",
        "dbs",
        "sahasrahlaNames"
      ))

      let preParts = namesDB.parts.pre
      if (randFuncs.randPick(preParts).includes("Sahasrahla")) {
        preParts = sahaNames.map(
          s => s.ucfirst() + "'" + (s.endsWith("s") ? "" : "s")
        )
      }

      newName += randFuncs.randPick(preParts)
      newName += " "
      newName += randFuncs.randPick(namesDB.parts.post)
    }

    if ((oldName == newName) || (newName.length > 32)) {
      console.log(`Attempted to change '${member.user.username}' in '${member.guild.name}' to: '${newNickname}' [${newNickname.length}]`)
      newName = await selectName(newChannel)
    }
  }

  return newName
}

/**
 * @param {RookClient} client
 * @param {GuildChannel} newChannel
 */
module.exports = async (client, newChannel) => {
  let result = false
  let messages = []

  if (!newChannel) {
    messages.push(`   No new channel in '${newChannel.guild.name}'`)
    return [result, messages]
  }

  if (!newChannel.isVoiceBased()) {
    messages.push(`'${newChannel.name}' of '${newChannel.guild.name}' is not a Voice-based channel`)
    return [result, messages]
  }

  let oldName = newChannel.name
  let newName = await selectName(newChannel)

  if ((newName != "") && (newName != newChannel.name)) {
    result = await newChannel.edit(
      {
        name: newName
      }
    )
    messages.push(
      JSON.stringify(
        {
          guild: newChannel.guild.name,
          action: "edit",
          type: ChannelType[newChannel.type],
          oldName: oldName,
          newName: newName
        }
      )
    )
    return [result, messages]
  }

  return [result, messages]
}
