// @ts-nocheck

const { Message, codeBlock } = require('discord.js')
const { EventScript } = require('../../classes/event/eventscript.class')
const { RookClient } = require('../../classes/objects/rclient.class')
const { RookEmbed } = require('../../classes/embed/rembed.class')
const mentionFuncs = require('../../utils/formatters/mentions')
const fileFuncs = require('../../utils/fs/fileFuncs')
const dbFuncs = require('../../utils/db/dbFuncs')
const getters = require('../../utils/guild/getters')

/**
 * @class
 * @this {TxtFileEvent}
 * @public
 */
module.exports = class TxtFileEvent extends EventScript {
  constructor(client) {
    let evtprops = {
      name: "txtFile",
      event: "messageCreate",
      label: "Text File Tester",
      description: "Read a Text file uploaded in a message"
    }
    super(
      client,
      {...evtprops}
    )
  }

  /**
   * 
   * @param {RookClient} client 
   * @param {Message} message 
   * @returns 
   */
  async action(client, message) {
    // this.messages.push(`/${this.name}: Event Action`)

    if (!message) {
      // this.messages.push("No Message")
      return false
    }

    if (!message.guild) {
      // this.message.push("No Guild")
      return false
    }

    if (!message.channel) {
      // this.message.push("No Channel")
      return false
    }

    if (message.author.id == client.user.id) {
      // this.messages.push("It's the Bot")
      return false
    }

    if (message?.attachments?.size <= 0) {
      // this.messages.push("No Attachments")
      return false
    }

    let channelIDs = null
    let dbRes = await dbFuncs.getDB(
      message.guild.id,
      "channels"
    )
    channelIDs = dbRes[0]
    // this.messages.push(...dbRes[1])

    if (!channelIDs) {
      this.messages.push(`Channel IDs not found for ${mentionFuncs.guildMention(message.guild.name, message.guild.id, { showID: true, oneLine: true, textOnly: true })}`)
      return false
    }

    // let channelName = "multiworld-planning"
    let channelName = "bot-testing"
    let channelID   = channelIDs[channelName]
    if (message.channel.id != channelID) {
      // this.messages.push("Not target Channel ID!")
      return false
    }

    for (let [attachmentID, aData] of message.attachments) {
      // FIXME: Extrapolate this into its own event class
      if (
        aData.name.toLowerCase()
          .includes("txt")
      ) {
        this.messages.push(
          JSON.stringify(
            {
              name: message.author.tag,
              guild: message.guild.name,
              channel: message.channel.name,
              filename: aData.name
            }
          )
        )
        let txt = await fileFuncs.getAURL(aData.url)

        let props = {
          title: { text: aData.name },
          description: codeBlock(txt)
        }

        let embed = new RookEmbed(client, props)

        message.channel.send({ embeds: [ embed ] })
      }
    }
  }
}
