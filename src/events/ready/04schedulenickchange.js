// @ts-nocheck

const scheduleNicknameChange = require('../../utils/scheduleNicknameChange')

module.exports = async (client) => {
  // Guilds to search in
  let guilds = [
    "745409743593406634"
  ]
  for(let guildID in guilds) {
    // Find the guild
    let guild = await client.guilds.cache.find(
      g => g.id === guildID
    )
    // Users to search for
    let users = [
      "1111517386588307536"
    ]
    for(let userID in users) {
      try {
        // Get the guild member
        const member = await guild.members.fetch(
          userID,
          { force: true }
        ).catch(
          err => {
            console.error("Fetch error:", err)
          }
        )

        // If it broke, throw an error
        if (!member || !member.user) {
          throw new Error("Member not found or invalid data.")
        }

        // If we got here, schedule the nickname change
        await scheduleNicknameChange(client, member)
      } catch (error) {
        const member = null
      }
    }
  }
}
