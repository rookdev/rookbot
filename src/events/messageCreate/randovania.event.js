// @ts-nocheck

const { Message, inlineCode, hyperlink, codeBlock } = require('discord.js')
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
 * @this {RandovaniaYamlEvent}
 * @public
 */
module.exports = class RandovaniaYamlEvent extends FileReaderEvent {
  constructor(client) {
    let evtprops = {
      filexts:      [ "rdvgame", "rdvpreset" ],
      // channelName:  "multiworld-scheduling",
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

    let gameIDs = {
      fusion: "Metroid Fusion"
    }

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
        let aYaml = await fileFuncs.getAURL(aData.url, "yaml")
        let isRDVgame = aData.name.toLowerCase().includes("rdvgame")
        let isRDVpreset = aData.name.toLowerCase().includes("rdvpreset")
        let info = isRDVgame ? aYaml.info : null
        let preset = isRDVgame ? info.presets[0] : aYaml

        let fields = [
          [
            {
              name: "Randovania Version",
              value: info ?
                hyperlink(
                  inlineCode(info["randovania_version"]),
                  `http://github.com/randovania/randovania/releases/tag/v${info['randovania_version']}`
                ) : ""
            },
            {
              name: "Randovania Commit",
              value: info ? 
                hyperlink(
                  inlineCode(info["randovania_version_git"]),
                  `http://github.com/randovania/randovania/commit/${info['randovania_version_git']}`
                ) : ""
            },
            {
              name: "Permalink",
              value: info ? codeBlock(info?.permalink) : ""
            }
          ],
          [
            {
              name: "Word Hash",
              value: info ? codeBlock(info["word_hash"]) : ""
            },
            {
              name: "Game",
              value: preset?.game && Object.keys(gameIDs).includes(preset?.game) ? gameIDs[preset.game] : preset?.game
            },
            {
              name: "Preset Name",
              value: preset?.name
            }
          ],
          [
            {
              name: "Starting Location",
              value: preset?.configuration["starting_location"][0]?.region + " - " + preset?.configuration["starting_location"][0]?.area
            }
          ]
        ]

          // Prepare the embed
        let embedTitle = ""
        embedTitle += "Randovania "
        embedTitle += (isRDVgame ? "Game": "Preset") + " "
        embedTitle += "Parser"
        let embedProps = {
          title: {
            text: embedTitle,
            emoji: "📝"
          },
          fields: fields
        }

        let rdvPost = await new RookMessage(
          client,
          message,
          {
            channelName: message.channel.id,
            pages: [ embedProps ]
          }
        )
        await rdvPost.execute()
      }
    }
  }
}
