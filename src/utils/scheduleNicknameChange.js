const { changeNickname } = require('../utils/changeNickname')  // Import the changeNickname function
const schedule = require('node-schedule')

// Schedule nickname change
function scheduleNicknameChange(client, member) {
  // If we don't have a member, bail
  if (!member || !member.user)
    return

  // Set it for midnight Pacific Time,
  //  which is superior to Eastern Palace Time
  const midnightPacific = {
    hour: 0,
    minute: 0,
    tz: "America/Los_Angeles"
  }

  schedule.scheduleJob(midnightPacific, async () => {
    try {

      // Call the changeNickname function to change the nickname
      let result = await changeNickname(client, member)
      if (typeof result.message === "object") {
        result.message = result.message.join("\n")
      }

      // Check the result and log accordingly
      if (result.success) {
        // console.log(`   Changed nickname of '${member.user.tag}' in '${member.guild.name}': ${result.message}`)
      } else {
        // console.error(`   Error changing nickname for '${member.user.tag}' in '${member.guild.name}': ${result.message}`)
      }
    } catch (err) {
      // console.error("   Error changing nickname:", err)
    }
  })

  console.log(`   Scheduled nickname changes for '${member.user.tag}' in '${member.guild.name}'.`)
}

module.exports = scheduleNicknameChange
