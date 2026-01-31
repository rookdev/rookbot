// @ts-nocheck
const mentionFuncs = require('../../utils/formatters/mentions')
// Use Discord HammerTime
const timeFormat = require('../../utils/formatters/timeFormat')
const moment = require('moment')

module.exports = async (client) => {
  let guildInfo     = ""
  let offlineMoment = moment.utc()
  let offlineTime   = timeFormat(offlineMoment.format("x"), { showSeconds: true })
  let messages = []

  if (client?.guild) {
    guildInfo += " ("
    guildInfo += mentionFuncs.guildMention(client.guild.name, client.guild.id, { showID: true, textOnly: true, oneLine: true })
    guildInfo += ")"
  }
  messages.push(`RATE LIMITED: ${client.user.tag}${guildInfo} at ${offlineTime}`)

  return [true, messages]
}
