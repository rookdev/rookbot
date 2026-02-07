// @ts-nocheck

const { Message, codeBlock } = require('discord.js')
const { EventScript } = require('./eventscript.class')
const { RookClient } = require('../objects/rclient.class')
const { RookEmbed } = require('../embed/rembed.class')
const mentionFuncs = require('../../utils/formatters/mentions')
const fileFuncs = require('../../utils/fs/fileFuncs')
const dbFuncs = require('../../utils/db/dbFuncs')
const getters = require('../../utils/guild/getters')

/**
 * @class
 * @this {FileReaderEvent}
 * @public
 */
class FileReaderEvent extends EventScript {
  constructor(client, cevtprops) {
    if (!cevtprops.filexts) {
      cevtprops.filexts = [ "txt" ]
    }
    let evtprops = {
      name: `${cevtprops.filexts[0]}File`,
      event: "messageCreate",
      label: "File Reader",
      description: `Read a ${cevtprops.filexts[0]} file uploaded in a message`
    }
    super(
      client,
      {...evtprops}
    )

    // File Extension
    this.filexts = cevtprops.filexts

    // Null Channel
    this.channel = null

    // Channel ID provided
    if (cevtprops.channelID) {
      this.channelId = cevtprops.channelID
    }
    // Channel Name provided
    if (cevtprops.channelName) {
      this.channelName = cevtprops.channelName
    }
    // Channel Slug provided
    if (cevtprops.channelSlug) {
      this.channelSlug = cevtprops.channelSlug
    }
  }

  async build(client, message) {
    // this.messages.push(`/${this.name}: Event Build`)

    if (!message) {
      this.messages.push("No Message")
      return false
    }

    if (!message.guild) {
      this.message.push("No Guild")
      return false
    }

    if (!message.channel) {
      this.message.push("No Channel")
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

    if (this?.channelId || this?.channelName) {
      let check = this?.channelId ?? this?.channelName ?? null
      if (check) {
        this.channel = await getters.getCache(client, message.guild, "channels", check)
        if (this.channel) {
          this.channelId = this.channel.id
        }
      }
    } else if (this?.channelSlug) {
      let dbRes = await dbFuncs.getDB(
        message.guild.id,
        "channels"
      )      
      let channelIDs = dbRes[0]
      this.messages.push(...dbRes[1])
      if (!channelIDs) {
        this.messages.push(`Channel IDs not found for ${mentionFuncs.guildMention(message.guild.name, message.guild.id, { showID: true, oneLine: true, textOnly: true })}`)
      }
      this.channelId = channelIDs[this.channelSlug]
    }

    if (!this.channel && this.channelId) {
      this.channel = await getters.getCache(client, message.guild, "channels", this.channelId)
    }

    if (message.channel.id != this.channel.id) {
      // this.messages.push("Not target Channel ID!")
      return false
    }

    let action_result = await this.action(client, message)
    return action_result
  }

  /**
   * 
   * @param {RookClient} client 
   * @param {Message} message 
   * @returns 
   */
  async action(client, message) {
    // this.messages.push(`/${this.name}: Event Action`)

    for (let [attachmentID, aData] of message.attachments) {
      let hasFileExt = false
      for (let filext of this.filexts) {
        if (!hasFileExt) {
          if (aData.name.toLowerCase().includes(filext)) {
            hasFileExt = true
          }
        } else {
          break
        }
      }
      if (hasFileExt) {
        this.messages.push(
          JSON.stringify(
            {
              name: message.author.tag,
              guild: message.guild.name,
              channel: message.channel.name,
              filexts: this.filexts,
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

exports.FileReaderEvent = FileReaderEvent
