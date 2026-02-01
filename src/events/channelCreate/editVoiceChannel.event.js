// @ts-nocheck

const { ChannelType, Channel, hyperlink } = require('discord.js')
const { EventScript } = require('../../classes/event/eventscript.class')
const { RookClient } = require('../../classes/objects/rclient.class')
const mentionFuncs = require('../../utils/formatters/mentions')
const fileFuncs = require('../../utils/fs/fileFuncs')
const randFuncs = require('../../utils/primitives/randFuncs') // Random Functions
const dbFuncs = require('../../utils/db/dbFuncs')

/**
 * @class
 * @this {EditVoiceChannelEvent}
 * @public
 */
module.exports = class EditVoiceChannelEvent extends EventScript {
  constructor(client) {
    let evtprops = {
      name: "editVoiceChannel",
      event: "channelCreate",
      label: "Edit Voice Channel Name",
      description: "Edit a Voice Channel Name based on provided rules when it's created."
    }
    super(
      client,
      {...evtprops}
    )
  }

  async selectName(newChannel) {
    let oldName = newChannel.name
    let newName = newChannel.name

    // DB
    let dbRes = await dbFuncs.getDB(
      newChannel.guild.id,
      "voiceChannelNames"
    )
    let namesDB = dbRes[0]
    let messages = []
    this.messages.push(...dbRes[1])
    // /DB

    if (!namesDB) {
      this.messages.push(`No voice channel names found for '${newChannel.guild.name}' (ID ${newChannel.guild.id})`)
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
      this.messages.push(`'${newChannel.name}' of '${newChannel.guild.name}' not in a specified category`)
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
        this.messages.push(`${client.profile.emojis.warning} Attempted to change '${member.user.tag}' in '${member.guild.name}' to: '${newNickname}' [${newNickname.length}]`)
        let newMessages = []
        newName, newMessages = await selectName(newChannel)
        this.messages.push(newMessages)
      }
    }

    return [newName, messages]
  }

  /**
   * 
   * @param {RookClient} client 
   * @param {Channel} newChannel 
   * @returns 
   */
  async action(client, newChannel) {
    // this.messages.push(`/${this.name}: Event Action`)

    if (!newChannel) {
      this.messages.push(`${client.profile.emojis.warning} No new channel in ${mentionFuncs.guildMention(newChannel.guild.name, newChannel.guild.id, { showID: true, oneLine: true, textOnly: true })}`)
    }
    if (!newChannel.isVoiceBased()) {
      this.messages.push(`${client.profile.emojis.warning} ${mentionFuncs.channelMention(newChannel.id, { showID: true, oneLine: true, textOnly: true })} of ${mentionFuncs.guildMention(newChannel.guild.name, newChannel.guild.id, { showID: true, oneLine: true, textOnly: true })} is not a Voice-based channel`)
    }

    let oldName = newChannel.name
    let [newName, newMessages] = await this.selectName(newChannel)

    if ((newName != "") && (newName != oldName)) {
      await newChannel.edit(
        {
          name: newName
        }
      )
    }

    // appended messages for debugging
    await this.logMessages(
      "✏️",
      {
        guild: newChannel.guild.name,
        action: "edit",
        type: ChannelType[newChannel.type],
        oldName: oldName,
        newName: newName
      }
    )
  }
}
