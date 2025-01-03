// @ts-nocheck

const { MessageFlags } = require('discord.js')
const getLocalCommands = require('../../utils/getLocalCommands')

module.exports = async (client, interaction) => {
  if (!interaction.isChatInputCommand()) return

  const roles = require('../../dbs/roles.json')
  const userIDs = require('../../dbs/userids.json')
  const guildIDs = require('../../dbs/guilds.json')

  const localCommands = getLocalCommands(client)

  try {
    let commandObject = localCommands.find(
      cmd => cmd.name === interaction.commandName
    )

    let coptions = {}
    if (!commandObject) {
      for (let cmd of localCommands) {
        if (cmd?.aliases && cmd.aliases.length > 0) {
          for (let alias of cmd.aliases) {
            if (alias.name === interaction.commandName) {
              commandObject = cmd
              coptions = alias.options
              console.log(`/${alias.name} is an alias of /${cmd.name} with`, coptions)
            }
          }
        }
      }
      if (!commandObject) {
        return
      }
    }

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
        let intOptions = {
          content: `${client.profile.emojis.fail} Only BotDevs are allowed to run this command.`,
          flags: MessageFlags.Ephemeral
        }
        interaction.reply(intOptions)
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
        let intOptions = {
          content: `${client.profile.emojis.fail} This command cannot be ran here.`,
          flags: MessageFlags.Ephemeral
        }
        interaction.reply(intOptions)
        return
      }
    }

    if (commandObject.userPermissions?.length) {
      for (const permission of commandObject.userPermissions) {
        if (!interaction.member?.permissions.has(permission)) {
          let intOptions = {
            content: `${client.profile.emojis.user} User is missing permissions.`,
            flags: MessageFlags.Ephemeral
          }
          interaction.reply(intOptions)
          return
        }
      }
    }

    if (commandObject.botPermissions?.length) {
      for (const permission of commandObject.botPermissions) {
        const bot = interaction.guild.members.me

        if (!bot.permissions.has(permission)) {
          let intOptions = {
            content: `${client.profile.emojis.bot} Bot is missing permissions.`,
            flags: MessageFlags.Ephemeral
          }
          interaction.reply(intOptions)
          return
        }
      }
    }

    await commandObject.execute(
      client,
      interaction,
      coptions
    )
  } catch (error) {
    console.log(`There was an error running this command: ${error.stack}`)
  }
}
