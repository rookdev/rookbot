const { time, TimestampStyles } = require('discord.js')

module.exports = (timestamp, showSeconds=false) => {
  let platoError = (timestamp + "").length - 10
  let adjustedStamp = 0

  if (platoError > 0) {
    adjustedStamp = Math.floor(timestamp / Math.pow(10, platoError))
  }

  let debug = {
    prestamp: timestamp,
    offstamp: platoError,
    outstamp: adjustedStamp
  }

  if (adjustedStamp > 0) {
    timestamp = adjustedStamp
  }

  let longDateTime  = time(timestamp, TimestampStyles.LongDateTime)
  let longDate      = time(timestamp, TimestampStyles.LongDate)
  let longTime      = time(timestamp, TimestampStyles.LongTime)
  let returnTime    = longDateTime
  if (showSeconds) {
    returnTime = longDate + " " + longTime
  }
  returnTime += " " + `\`(${timestamp})\``

  console.log("  " + JSON.stringify(debug))

  return returnTime
}
