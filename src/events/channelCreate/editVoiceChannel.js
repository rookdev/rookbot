// @ts-nocheck
// Channel Type
const { ChannelType } = require('discord.js')
// Rook-branded Client
const { RookClient } = require('../../classes/objects/rclient.class')
// Rook-branded Embed
const { RookEmbed } = require('../../classes/embed/rembed.class')
const fileFuncs = require('../../utils/fs/fileFuncs')
const randFuncs = require('../../utils/primitives/randFuncs') // Random Functions
const dbFuncs = require('../../utils/db/dbFuncs')

async function selectName(newChannel) {
  let oldName = newChannel.name
  let newName = newChannel.name

  // DB
  let dbRes = await dbFuncs.getDB(
    newChannel.guild.id,
    "voiceChannelNames"
  )
  let namesDB = dbRes[0]
  let messages = dbRes[1]
  // /DB

  if (!namesDB) {
    messages.push(`No voice channel names found for '${newChannel.guild.name}' (ID ${newChannel.guild.id})`)
    return [newName, messages]
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
    messages.push(`'${newChannel.name}' of '${newChannel.guild.name}' not in a specified category`)
    return [newName, messages]
  }

  if (changeName) {
    let mode = namesDB?.mode ?? "normal"
    newName = ""

    if (mode == "normal") {
      newName += randFuncs.randPick(namesDB.parts.names)
    } else if (mode == "build") {
      let sahaNames = fileFuncs.getAFile(
        [
          "src",
          "dbs"
        ],
        "sahasrahlaNames.json"
      )

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
      messages.push(`${client.profile.emojis.warning} Attempted to change '${member.user.tag}' in '${member.guild.name}' to: '${newNickname}' [${newNickname.length}]`)
      let newMessages = []
      newName, newMessages = await selectName(newChannel)
      messages = messages.concat(newMessages)
    }
  }

  return [newName, messages]
}

/**
 * @param {RookClient} client
 * @param {GuildChannel} newChannel
 */
module.exports = async (client, newChannel) => {
  let result = false
  let messages = []

  if (!newChannel) {
    messages.push(`${client.profile.emojis.warning} No new channel in '${newChannel.guild.name}'`)
    return [result, messages]
  }

  if (!newChannel.isVoiceBased()) {
    messages.push(`${client.profile.emojis.warning} '${newChannel.name}' of '${newChannel.guild.name}' is not a Voice-based channel`)
    return [result, messages]
  }

  let oldName = newChannel.name
  let newName, newMessages = await selectName(newChannel)
  messages = messages.concat(newMessages)

  if ((newName != "") && (newName != newChannel.name)) {
    result = await newChannel.edit(
      {
        name: newName
      }
    )
    messages.push(
      "✏️ " +
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
