const { birthdayNotif } = require('../guild/birthdayNotif')  // Import the changeNickname function
const schedule = require('node-schedule')

// Schedule birthday notification
function scheduleBirthdayNotif(client, guild) {
  let result = false
  let messages = []

  // If we don't have a guild, bail
  if (!guild) {
    return [false, []]
  }

  // Set it for midnight Pacific Time,
  //  which is superior to Eastern Palace Time
  const midnightPacific = {
    hour: 0,
    minute: 0,
    tz: "America/Los_Angeles"
  }

  schedule.scheduleJob(midnightPacific, async () => {
    try {
      // Call the birthdayNotif function to scan for birthdays to notify about
      let bdayResult = await birthdayNotif(client, guild)
      if (typeof bdayResult.message === "object") {
        bdayResult.message = bdayResult.message.join("\n")
      }

      // Check the result and log accordingly
      if (bdayResult.success) {
        // Success
      } else {
        // Fail
      }
      messages = messages.concat(bdayResult.message)
    } catch (err) {
      // messages.push(`${client.profile.emojis.fail} Error with birthday notifs:`, err)
    }
  })

  // Success

  return [result, messages]
}

module.exports = scheduleBirthdayNotif
