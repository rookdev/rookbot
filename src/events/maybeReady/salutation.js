// @ts-nocheck

module.exports = async (client, interaction, mode) => {
  // Get Salutation Command
  let cmd_defn = require(`../../commands/app/${mode}`)

  // Create Salutation Command Object
  let cmd_obj = new cmd_defn(client)

  // Execute Salutation Command
  await cmd_obj.execute(client, interaction)
}
