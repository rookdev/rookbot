// @ts-nocheck

const getLocalCommands = require('../../utils/getLocalCommands')

module.exports = async (client, interaction) => {
  if (!interaction.isChatInputCommand()) return

  const roles = require('../../dbs/roles.json')
  const userIDs = require('../../dbs/userids.json')
  const guildIDs = require('../../dbs/guilds.json')

  const localCommands = getLocalCommands(client)

  try {
    const commandObject = localCommands.find(
      cmd => cmd.name === interaction.commandName
    )

    if (!commandObject) return

    if (commandObject.devOnly) {
      let roleName = "botdev"
      let roleUserNames = roles[roleName]
      let roleUserIDs = []
      for (let [userName, userID] of Object.entries(userIDs)) {
        if (roleUserNames.includes(userName)) {
          roleUserIDs.push(userID)
        }
      }
      console.log(roleName,roleUserNames,roleUserIDs)
      if (!roleUserIDs.includes(interaction.member.id)) {
        interaction.reply({
          content: 'Only developers are allowed to run this command.',
          ephemeral: true
        })
        return
      }
    }

    if (commandObject.testOnly) {
      let testGuilds = []
      for (let [guildID, guildName] of Object.entries(guildIDs)) {
        if (guildName.includes("Test")) {
          testGuilds.push(guildID)
        }
      }
      if (!(testGuilds.includes(interaction.guild.id))) {
        interaction.reply({
          content: 'This command cannot be ran here.',
          ephemeral: true
        })
        return
      }
    }

    if (commandObject.userPermissions?.length) {
      for (const permission of commandObject.userPermissions) {
        if (!interaction.member.permissions.has(permission)) {
          interaction.reply({
            content: 'User is missing permissions.',
            ephemeral: true
          })
          return
        }
      }
    }

    if (commandObject.botPermissions?.length) {
      for (const permission of commandObject.botPermissions) {
        const bot = interaction.guild.members.me

        if (!bot.permissions.has(permission)) {
          interaction.reply({
            content: "Bot is missing permissions.",
            ephemeral: true
          })
          return
        }
      }
    }

    await commandObject.execute(client, interaction)
  } catch (error) {
    console.log(`There was an error running this command: ${error.stack}`)
  }
}
