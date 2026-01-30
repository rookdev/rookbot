// @ts-nocheck

const { MessageFlags, inlineCode } = require('discord.js')
const getLocalCommands = require('../../utils/client/getLocalCommands')

module.exports = async (client, interaction) => {
  let result = false
  let messages = []

  if (!interaction.isChatInputCommand()) {
    // messages.push(`${client.profile.emojis.fail} Not a chat input command`)
    return [result, messages]
  }

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
              messages.push(`/${alias.name} is an alias of /${cmd.name} with ` + JSON.stringify(coptions))
            }
          }
        }
      }
      if (!commandObject) {
        messages.push(`${client.profile.emojis.fail} No command object found`)
        interaction.reply(
          {
            content: `${inlineCode('/' + interaction.commandName)} not found!`,
          }
        )
        return [result, messages]
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
      if (!roleUserIDs.includes(interaction.member.id)) {
        let content = `${client.profile.emojis.fail} Only BotDevs are allowed to run this command.`
        let intOptions = {
          content: content,
          flags: MessageFlags.Ephemeral
        }
        interaction.reply(intOptions)
        messages.push(content)
        return [result, messages]
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
        let content = `${client.profile.emojis.fail} This command cannot be ran here.`
        let intOptions = {
          content: content,
          flags: MessageFlags.Ephemeral
        }
        interaction.reply(intOptions)
        messages.push(content)
        return [result, messages]
      }
    }

    if (commandObject.userPermissions?.length) {
      for (const permission of commandObject.userPermissions) {
        if (!interaction.member?.permissions.has(permission)) {
          let content = `${client.profile.emojis.user} User is missing permissions.`
          let intOptions = {
            content: content,
            flags: MessageFlags.Ephemeral
          }
          interaction.reply(intOptions)
          messages.push(content)
          return [result, messages]
        }
      }
    }

    if (commandObject.botPermissions?.length) {
      for (const permission of commandObject.botPermissions) {
        const bot = interaction.guild.members.me

        if (!bot.permissions.has(permission)) {
          let content = `${client.profile.emojis.bot} Bot is missing permissions.`
          let intOptions = {
            content: content,
            flags: MessageFlags.Ephemeral
          }
          interaction.reply(intOptions)
          messages.push(content)
          return [result, messages]
        }
      }
    }

    messages = messages.filter(item => item !== "")
    if (messages.length) {
      console.log(
        messages.map(
          m => "   " + m
        ).join("\n")
      )
      messages = []
    }
    result = await commandObject.execute(
      client,
      interaction,
      coptions
    )
  } catch (error) {
    messages.push(`${client.profile.emojis.fail} There was an error running this command: ${error.stack}`)
    return [result, messages]
  }

  return [result, messages]
}
