const {
  SlashCommandBuilder,
  ApplicationCommandOptionType,
  SlashCommandRoleOption,
  SlashCommandAttachmentOption,
  SlashCommandBooleanOption,
  SlashCommandChannelOption,
  SlashCommandIntegerOption,
  SlashCommandNumberOption,
  SlashCommandStringOption,
  SlashCommandUserOption,
  SlashCommandMentionableOption
} = require('discord.js')
const globalFuncs = require('../../utils/primitives/globalFuncs')
const fileFuncs = require('../fs/fileFuncs')
const getters = require('../../utils/guild/getters')
const path = require('path')

function addSlashCommandOption(subcommand, option) {
  switch(option?.type) {
    case ApplicationCommandOptionType.Attachment:
      let attachOption = new SlashCommandAttachmentOption()
      attachOption.setName(option.name)
      attachOption.setDescription(option.description)
      if (option?.required) {
        attachOption.setRequired(true)
      }
      subcommand.addAttachmentOption(attachOption)
      break
    case ApplicationCommandOptionType.Boolean:
      let boolOption = new SlashCommandBooleanOption()
      boolOption.setName(option.name)
      boolOption.setDescription(option.description)
      if (option?.required) {
        boolOption.setRequired(true)
      }
      subcommand.addBooleanOption(boolOption)
      break
    case ApplicationCommandOptionType.Channel:
      let chanOption = new SlashCommandChannelOption()
      chanOption.setName(option.name)
      chanOption.setDescription(option.description)
      if (option?.required) {
        chanOption.setRequired(true)
      }
      subcommand.addChannelOption(chanOption)
      break
    case ApplicationCommandOptionType.Integer:
      let intOption = new SlashCommandIntegerOption
      intOption.setName(option.name)
      intOption.setDescription(option.description)
      if (option?.required) {
        intOption.setRequired(true)
      }
      if (option?.choices) {
        intOption.setChoices(option.choices)
      }
      subcommand.addIntegerOption(intOption)
      break
    case ApplicationCommandOptionType.Mentionable:
      let menOption = new SlashCommandMentionableOption()
      menOption.setName(option.name)
      menOption.setDescription(option.description)
      if (option?.required) {
        menOption.setRequired(true)
      }
      subcommand.addMentionableOption(menOption)
      break
    case ApplicationCommandOptionType.Number:
      let numOption = new SlashCommandNumberOption()
      numOption.setName(option.name)
      numOption.setDescription(option.description)
      if (option?.required) {
        numOption.setRequired(true)
      }
      if (option?.choices) {
        numOption.setChoices(option.choices)
      }
      subcommand.addNumberOption(numOption)
      break
    case ApplicationCommandOptionType.Role:
      let roleOption = new SlashCommandRoleOption()
      roleOption.setName(option.name)
      roleOption.setDescription(option.description)
      if (option?.required) {
        roleOption.setRequired(true)
      }
      subcommand.addRoleOption(roleOption)
      break
    case ApplicationCommandOptionType.String:
      let strOption = new SlashCommandStringOption()
      strOption.setName(option.name)
      strOption.setDescription(option.description)
      if (option?.required) {
        strOption.setRequired(true)
      }
      if (option?.choices) {
        strOption.setChoices(option.choices)
      }
      subcommand.addStringOption(strOption)
      break
    case ApplicationCommandOptionType.User:
      let userOption = new SlashCommandUserOption()
      userOption.setName(option.name)
      userOption.setDescription(option.description)
      if (option?.required) {
        userOption.setRequired(true)
      }
      subcommand.addUserOption(userOption)
      break
  }
  return subcommand
}
function addSlashCommandOptions(subcommand, options) {
  for (let option of options) {
    subcommand = addSlashCommandOption(subcommand, option)
  }
  return subcommand
}

module.exports = async (client, exceptions = []) => {
  let localCommands = []

  const commandCategories = fileFuncs.getAllFiles(
    [
      "src",
      "commands"
    ],
    true
  )

  for (const commandCategory of commandCategories) {
    // Get Category Name
    let commandCategoryName = commandCategory.split(path.sep).at(-1)
    // console.log(`Folder: ${commandCategoryName}`)

    // Get Category Command Files
    const commandFiles = fileFuncs.getAllFiles(commandCategory)

    // Get Category Command Names
    let filenames = commandFiles.map(
      fpath => fpath.split(path.sep).at(-1)
    )

    // If we have an Index file, it's a Subcommand
    let hasSubcommands = filenames.contains("index.js")

    // If we're processing a Subcommand
    if (hasSubcommands) {
      // continue

      // /chan_edit
      //  /edit channel
      //  -mode:
      //   Sync:    channel must have a parent
      //   Sort:    channel must have a parent
      //   NSFW:    channel must not be a category
      //   Delete:  any channel
      //  -channel
      //  -channel-id
      //  -channel-name
      //  -channel-topic
      //  -parent
      //  -parent-id
      //  -position
      // /role_edit
      //  /edit role
      //  -mode: Delete
      //  -role
      //  -role-id
      //  -role-name
      //  -color

      // Subcommand Set
      // console.log(` Subcommands: ${filenames.join(", ")}`)
      let commandsManager     = null
      let applicationCommands = null

      const isDevelopment = !process.env.ENV_ACTIVE.startsWith('prod')
      if (isDevelopment) {
        const testGuildID = process.env.GUILD_ID
        if (!testGuildID) { continue }

        if ((commandCategoryName == "seedannounce2") && (testGuildID != "1303864272832565268")) { continue }

        const testGuild = await getters.getCachedGuild(client, testGuildID)
        if (!testGuild) { continue }

        commandsManager = await testGuild.commands
      } else {
        commandsManager = await client.application.commands
      }

      applicationCommands = await commandsManager.fetch()

      if (!applicationCommands) { continue }

      const processCommand = true
      if (processCommand) {
        let cmdParts = {
          name: commandCategoryName
        }
        const existingCommand = applicationCommands.find(
          cmd => cmd.name === cmdParts.name
        )
        if (!existingCommand) {
          try {
            let subCommandData = {}
            subCommandData[commandCategoryName] = []
            const newSubcommand = new SlashCommandBuilder()
              .setName(commandCategoryName)
              .setDescription(commandCategoryName.ucfirst())

            for (let filename of filenames) {
              let filenameName = filename.replace(".js","")
              // Determine if we're just an Index or if we've got script files
              if (filename == "index.js") {
                let indexCmdScript = await fileFuncs.getAFile(
                  [ commandCategory ],
                  filename
                )
                if (indexCmdScript) {
                  let indexCmdObject = new indexCmdScript(client)
                  if (indexCmdObject) {
                    console.log("Checking SubAliases:",commandCategoryName)
                    if (indexCmdObject?.subAliases) {
                      // We have subAliases
                      // Stay here and do stuff, then continue
                      for (let subAlias of indexCmdObject.subAliases) {
                        console.log("Scanning:",commandCategoryName,subAlias.name)
                        if (globalFuncs.empty(subAlias?.name))        { continue }
                        if (globalFuncs.empty(subAlias?.description)) { continue }
                        subCommandData[commandCategoryName].push(subAlias.name)
                        newSubcommand.addSubcommand(
                          (subcommand) => {
                            subcommand
                            .setName(subAlias.name)
                            let subAliasDesc = subAlias.description
                            if (isDevelopment) {
                              if (!subAliasDesc.endsWith(` (${client.profile.emojis.dev})`)) {
                                subAliasDesc += ` (${client.profile.emojis.dev})`
                              }
                            }
                            subcommand.setDescription(subAliasDesc)
                            let subOptions = JSON.parse(JSON.stringify(indexCmdObject.options))
                            if (subAlias?.options) {
                              for (let [subOptIDX, subOption] of indexCmdObject.options.entries()) {
                                if (
                                  Object.keys(subAlias.options)
                                  .includes(subOption.name)
                                ) {
                                  delete subOptions[subOptIDX]
                                }
                              }
                            }
                            subcommand = addSlashCommandOptions(subcommand, subOptions)
                            return subcommand
                          }
                        )
                      }
                      continue
                    } else {
                      // We don't have subAliases
                      // Continue on to other files
                      continue
                    }
                  }
                }
              }
              // If we're a Subcommand Index with script files
              subCommandData[commandCategoryName].push(filenameName)
              let subCmdScript = await fileFuncs.getAFile(
                [ commandCategory ],
                filename
              )
              newSubcommand.addSubcommand(
                (subcommand) => {
                  subcommand
                  .setName(filenameName)
                  .setDescription(filenameName)
                  if (subCmdScript) {
                    let subCmdObject = new subCmdScript(client)
                    if (subCmdObject) {
                      if (subCmdObject?.description) {
                        let subDesc = subCmdObject.description
                        if (isDevelopment) {
                          if (!subDesc.endsWith(` (${client.profile.emojis.dev})`)) {
                            subDesc += ` (${client.profile.emojis.dev})`
                          }
                        }
                        subcommand.setDescription(subDesc)
                      }
                      if (subCmdObject?.options) {
                        subcommand = addSlashCommandOptions(subcommand, subCmdObject.options)
                      }
                    }
                  }
                  return subcommand
                }
              )
            }
            let printData = JSON.parse(JSON.stringify(newSubcommand))
            for (let k of Object.keys(printData)) {
              if (!["options","name"].includes(k)) {
                delete printData[k]
              }
            }
            await commandsManager.create(newSubcommand)
            console.log(`Registering new subcommand: ${JSON.stringify(subCommandData)}`)
            // console.log(printData)
          } catch (error) {
            console.log(error.stack)
          }
        } else {
          let commandObject = await fileFuncs.getAFile(
            [ commandCategoryName ],
            "index.js"
          )
          if (commandObject) {
            if (commandObject?.name) {
              if (commandObject.name.includes("IndexCommand")) {
                let cmd = new commandObject(client)
                commandObject = cmd
                client.commands[commandCategoryName] = commandObject
                localCommands.push(commandObject)
              }
            }
          }
          let subCommandFiles = await fileFuncs.getAllFiles(
            [
              "src",
              "commands",
              commandCategoryName
            ]
          )
          let subCommandData = {}
          subCommandData[commandCategoryName] = []
          for (let filepath of subCommandFiles) {
            let filename = filepath.split(path.sep).at(-1).replace(".js","")
            commandObject = await fileFuncs.getAFile(filepath)
            if (filename == "index") {
              // Check SubAliases
              let cmd = new commandObject(client)
              if (cmd?.subAliases) {
                // If we have them, process index file, then continue
                for (let subAlias of cmd.subAliases) {
                  subCommandData[commandCategoryName].push(subAlias.name)
                  client.commands[`${commandCategoryName} ${subAlias.name}`] = cmd
                }
                continue
              }
            }
            if (commandObject?.name) {
              if (
                commandObject.name.toLowerCase().startsWith(commandCategoryName.toLowerCase()) &&
                commandObject.name.endsWith("Command")
              ) {
                let cmd = new commandObject(client)
                cmd.name = commandCategoryName + " " + filename
                client.commands[cmd.name] = cmd
              }
            }
            subCommandData[commandCategoryName].push(filename)
          }
          console.log("Current: " + JSON.stringify(subCommandData))
        }
      }
    } else {
      // Slash Command
      for (const commandFile of commandFiles) {
        // console.log(` Command: ${commandFile.split(path.sep).at(-1)}`)
        let commandObject = require(commandFile)
  
        if (exceptions.includes(commandObject.name)) {
          continue
        }
  
        if (commandObject) {
          if (commandObject?.name) {
            if (commandObject.name.includes("Command")) {
              let cmd = new commandObject(client)
              commandObject = cmd
            }
  
            localCommands.push(commandObject)
          }
        }
      }
    }
  }

  return localCommands
}
