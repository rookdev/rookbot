// @ts-nocheck

const scheduleNicknameChange = require('../../utils/scheduleNicknameChange')

module.exports = async (client) => {
  // Users to search for
  let users = [
    "263968998645956608",   // Minnie
    "1111517386588307536",  // castIe
  ]
  // Cycle through users
  for(let userID of users) {
    // Guilds to search in
    let guilds = [
      "1282788953052676177",  // DoI Main
      "1297216081110372474",  // DoI Navy
      "1303864272832565268",  // rook
      "745409743593406634",   // TridentBot
    ]
    // Cycle through guilds
    for(let guildID of guilds) {
      // Find the guild
      let guild = await client.guilds.cache.find(
        g => g.id === guildID
      )
      try {
        // Get the guild member
        const member = await guild.members.fetch(userID, { force: true }) || null

        if (member) {
          // If we got here, schedule the nickname change
          await scheduleNicknameChange(client, member)
        }
      } catch (error) {
        const member = null
      }
    }
  }
}
