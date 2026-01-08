// @ts-nocheck

// Use Discord HammerTime
const timeFormat = require('../../utils/formatters/timeFormat')
const moment = require('moment')

module.exports = async (client) => {
  let guildInfo     = ""
  let offlineMoment = moment.utc()
  let offlineTime   = timeFormat(offlineMoment.format("x"), { showSeconds: true })

  if (client?.guild) {
    if (client?.guild?.name) {
      guildInfo += ` (${client.guild.name}`
      if (client?.guild?.id) {
        guildInfo += ` [${client.guild.id}]`
      }
      guildInfo += `)`
    }
  }
  console.log(`RATE LIMITED: ${client.user.tag}${guildInfo} at ${offlineTime}`)
}
