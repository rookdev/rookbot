// @ts-nocheck

const { RookMessage } = require('../../classes/objects/rmessage.class')
const { RookEmbed } = require('../../classes/embed/rembed.class')
const { setValue } = require("../../utils/primitives/globalFuncs")
const mentionFuncs = require('../../utils/formatters/mentions')
const fileFuncs = require('../../utils/fs/fileFuncs')
const dbFuncs = require('../../utils/db/dbFuncs')
const getters = require('../../utils/guild/getters')
const moment = require('moment-timezone')
const fs = require('fs')

/**
 * @class
 * @classdesc Create a Rook-branded Event
 * @this {EventScript}
 * @public
 */
class EventScript {
  constructor(client, evtprops) {
    this.name = setValue(evtprops.name, "unknownName")
    this.event = setValue(evtprops.event, "unknownEvent")
    this.label = setValue(evtprops.label, "unknownLabel")
    this.props = {}
    this.pages = []
    this.error = false
    this.messages = []
  }

  async getCache(client, parent, cacheType, cacheTest) {
    return await getters.getCache(client, parent, cacheType, cacheTest)
  }

  async getDB(cName, dName) {
    return await dbFuncs.getDB(cName, dName)
  }

  async getChannel(client, guild, channelNames) {
    let dbRes = await this.getDB(guild.id, "channels")
    let guildChannels = dbRes[0]
    this.messages.push(...dbRes[1])

    if (typeof channelNames === "string") {
      channelNames = [ channelNames ]
    }

    let channel = null

    if (!guildChannels) {
      this.messages.push(`${client.profile.emojis.fail} Failed to fetch Guild Channels for ${mentionFuncs.guildMention(guild.name, guild.id, { showID: true, textOnly: true, oneLine: true })}`)
    }

    if (guildChannels) {
      for (let channelName of channelNames) {
        if (Object.keys(guildChannels).includes(channelName)) {
          if (!channel) {
            let guildChannel = guildChannels[channelName]
            channel = await this.getCache(
              client,
              guild,
              "channels",
              guildChannel
            )
          } else {
            break
          }
        }
      }
    }

    if (!channel) {
      for (let channelName of channelNames) {
        if (!channel) {
          channel = await this.getCache(
            client,
            guild,
            "channels",
            channelName
          )
        } else {
          break
        }
      }
    }

    return channel
  }

  async logPost(client, guild, logType, props) {
    let channel = await this.getChannel(client, guild, [ `logging-${logType}`, "logging" ])

    if (!channel) {
      this.messages.push(`${client.profile.emojis.fail} Log channel not found for ${mentionFuncs.guildMention(guild.name, guild.id, { showID: true, textOnly: true, oneLine: true })}`)
    }

    if (channel) {
      let logMessage = await new RookMessage(
        client,
        null,
        {
          channelName: channel.id,
          pages: props
        }
      )
      await logMessage.execute()
    }
  }

  async logFile(client, lines, logType) {
    const DEV = !process.env.ENV_ACTIVE.startsWith("prod")
    const logFilePath = fileFuncs.getAPath(
      [
        "src",
        "botlogs"
      ],
      `${DEV ? 'DEV' : ''}${logType}.log`
    )

    const logLines = [
      `[${moment.utc().toISOString()}]`,
      ...lines,
      `Event: ${this.label}`,
      '--------------------------------'
    ]

    fs.appendFileSync(logFilePath, logLines.join("\n") + "\n\n", 'utf8')

    // this.messages.push(
    //   logFilePath,
    //   ...logLines
    // )
  }

  async logMessages(emoji, message) {
    let msg = `${emoji} ${JSON.stringify(message)}`
    this.messages.push(msg)
  }

  async action(client, args) {
    // this.messages.push(`/${this.name}: Event Action`)
    this.messages.push(`Action Args: ${JSON.stringify(Object.keys(newMember))}`)
  }

  async printMessages() {
    let now = moment.utc()
    let nowLocal = now.clone().tz('America/Los_Angeles')
    let dateStamp = ""

    dateStamp += now.format()
    dateStamp += " | "
    dateStamp += nowLocal.format()

    let preamble = [
      // `/${this.name}: Event Print Messages`,
      dateStamp,
      ` Event: ${this.event}`,
      `  Script: ${this.name}`
    ]
    this.messages = this.messages.filter(item=>item !== "")
    this.messages = this.messages.map(m=>"   " + m)

    if (this.messages.length > 0) {
      this.messages.unshift(...preamble)
      console.log(this.messages.join("\n"))
    }
  }

  async build(client, ...args) {
    // this.messages.push(`/${this.name}: Event Build`)
    let action_result = await this.action(client, ...args)
    return action_result
  }

  async execute(client, ...args) {
    // this.messages.push(`/${this.name}: Event Execute`)
    let build_result = await this.build(client, ...args)
    this.printMessages()
  }

  async test(client) {
    // this.messages.push(`/${this.name}: Event Test`)
  }
}

exports.EventScript = EventScript
