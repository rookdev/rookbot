const { time, TimestampStyles } = require('discord.js')
const stringFuncs = require("../utils/stringFuncs")

module.exports = (timestamp, options) => {
  let platoError = (timestamp + "").length - 10
  let adjustedStamp = 0
  let showSeconds = options?.showSeconds
  let relative = options?.relative
  let withRelative = (options?.with == "relative")

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
  let relativeTime  = time(timestamp, TimestampStyles.RelativeTime)
  let returnTime    = longDateTime
  if (showSeconds) {
    returnTime = longDate + " " + longTime
  }
  returnTime += " " + `(${timestamp.inlinecode()})`

  if (withRelative) {
    returnTime += ` (${relativeTime})`
  } else if (relative) {
    returnTime = relativeTime
  }

  // console.log("   " + JSON.stringify(debug))

  return returnTime
}
