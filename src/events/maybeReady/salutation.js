// @ts-nocheck

module.exports = async (client, interaction, mode) => {
  let result = false
  let messages = []

  // Get Salutation Command
  let cmd_defn = require(`../../commands/app/${mode}`)

  // Create Salutation Command Object
  let cmd_obj = new cmd_defn(client)

  // Execute Salutation Command
  result = await cmd_obj.execute(client, interaction)

  return [result, messages]
}
