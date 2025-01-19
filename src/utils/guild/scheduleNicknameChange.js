const { changeNickname } = require('../guild/changeNickname')  // Import the changeNickname function
const schedule = require('node-schedule')

// Schedule nickname change
function scheduleNicknameChange(client, member) {
  let result = false
  let messages = []

  // If we don't have a member, bail
  if (!member || !member.user) {
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
      // Call the changeNickname function to change the nickname
      let nickResult = await changeNickname(client, member)
      if (typeof nickResult.message === "object") {
        nickResult.message = nickResult.message.join("\n")
      }

      // Check the result and log accordingly
      if (nickResult.success) {
        // messages.push(`${client.profile.emojis.check} Changed nickname of '${member.user.tag}' in '${member.guild.name}': ${result.message}`)
      } else {
        // messages.push(`${client.profile.emojis.fail} Error changing nickname for '${member.user.tag}' in '${member.guild.name}': ${result.message}`)
      }
      messages = messages.concat(nickResult.message)
    } catch (err) {
      // messages.push(`${client.profile.emojis.fail} Error changing nickname:`, err)
    }
  })

  messages.push(`${client.profile.emojis.check} Yes scheduled nickname changes for '${member.user.tag}' in '${member.guild.name}'.`)

  return [result, messages]
}

module.exports = scheduleNicknameChange
