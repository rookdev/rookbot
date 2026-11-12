const globalFuncs = require('../../utils/primitives/globalFuncs')
const getters = require('../../utils/guild/getters')

module.exports = async (client, oldUser, newUser) => {
  let result = false
  let messages = []

  if (globalFuncs.isDiscord(client)) {
    let repData = {
      "1450159772622913628": {
        "name": "ZDoI Randomizer Community",
        "roleID": "1570271647909552229"
      },
      "246204694396010497": {
        "name": "Juritsu's Safe Haven",
        "roleID": "1570283522650804264"
      }
    }

    for (let [repGuildID, rData] of Object.entries(repData)) {
      let repRoleID = rData["roleID"]
      let repGuild   = await getters.getCache(client, client, "guilds", repGuildID)

      if (repGuild) {
        let reppingGuild = false
        if (newUser?.primaryGuild?.identityGuildId) {
          reppingGuild = newUser.primaryGuild.identityGuildId == repGuild
        }
        if (repGuild) {
          let member = await getters.getCachedMember(client, repGuild, newUser.id)
          if (member) {
            if (reppingGuild) {
              await member.roles.add(repRoleID)
            } else {
              await member.roles.remove(repRoleID)
            }
          }
        }
      }
    }
  }

  return [result, messages]
}
