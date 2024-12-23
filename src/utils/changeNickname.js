const castIeNames = require('../dbs/castIe');  // Import the nickname arrays

// Main function to compare commands
module.exports = (client, member, isDoI) => {
  changeNickname(client, member, isDoI)
}

// Function to change a member's nickname
async function changeNickname(client, member) {
  try {
    // If we've got guilds to search
    if (client?.guilds) {
      for (let [ guildID, guildData ] of client.guilds.cache) {
        if (member) {
          let newNickname = ""

          // castIe
          if (member.id == "1111517386588307536") {
            // Weighted random selection for the nickname
            const randomChoice = Math.random()

            if (randomChoice < 0.7) {  // 70% chance for "topPicks"
              newNickname = castIeNames.topPicks[Math.floor(Math.random() * castIeNames.topPicks.length)]
            } else if (randomChoice < 0.85) {  // 15% chance for "castleSynonyms"
              newNickname = castIeNames.castleSynonyms[Math.floor(Math.random() * castIeNames.castleSynonyms.length)]
            } else {  // 15% chance for "meh"
              newNickname = castIeNames.meh[Math.floor(Math.random() * castIeNames.meh.length)]
            }

            // Change castIe's nickname
            if (guildID in castIeNames.prefixes) {
              newNickname = `${castIeNames.prefixes[guildID]}${newNickname}`
            }
          }

          // Set new nickname
          await member.setNickname(newNickname)

          return {
            success: true,
            message: `Changed nickname of '${member.user.tag}' in '${guildData.name}' to '${newNickname}'.`
          }
        }
      }
    }
  } catch(error) {
    console.error('Error changing nickname:', error)
    return {
      success: false,
      message: `There was an error changing the nickname: ${error.message}`
    }
  }
}

module.exports = { changeNickname }
