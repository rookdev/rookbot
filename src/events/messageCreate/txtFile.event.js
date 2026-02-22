// @ts-nocheck

const { Message, codeBlock } = require('discord.js')
const { FileReaderEvent } = require('../../classes/event/filereader.class')
const { RookMessage } = require('../../classes/objects/rmessage.class')
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
module.exports = class TxtFileEvent extends FileReaderEvent {
  constructor(client) {
    let evtprops = {
      filexts:      [ "txt" ],
      channelName:  "bot-testing",
      moo: ""
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

        let txtPost = await new RookMessage(
          client,
          message,
          {
            channelName: message.channel.id,
            pages: [ props ]
          }
        )
        await txtPost.execute()
      }
    }
  }
}
