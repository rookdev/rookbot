// @ts-nocheck
// Set up env vars
require('@dotenvx/dotenvx').config()
// Get Intents bitfields
const { IntentsBitField } = require('discord.js')
// Get RookClient
const { RookClient } = require('./classes/objects/rclient.class')
// Event Handler
const eventHandler = require('./handlers/eventHandler')
const { program } = require('commander')    // Commander for CLI management
const AsciiTable = require('ascii-table')   // Pretty-print in console
const PACKAGE = require("../package.json")  // Node Package data

async function callCommands(commandNames) {
  if (!typeof commandNames === "object") {
    commandNames = [commandNames]
  }

  // Get local commands
  const getLocalCommands = require('./utils/getLocalCommands')
  const localCommands = getLocalCommands(client)

  for(let commandName of commandNames) {
    const commandObject = localCommands.find(
      c => c.name === commandName
    )
    if (commandObject) {
      // Execute Command
      await commandObject.execute(
        // Pass RookClient object
        client,
        // Fake an Interaction object
        {
          client: client,
          member: { user: { tag: "gitrook" } },
          user: {
            name: "gitrook",
            avatarURL: () => { return "https://cdn.discordapp.com/avatars/1313777189187223603/4bc7c1dc2b41b0bd7f77945bcc55feef.webp?size=128" },
            username: "gitrook"
          },
          reply: async (props) => {
            let channelIDs = require(`./dbs/${process.env.GUILD_ID}/channels.json`)
            let channelID = channelIDs["bot-salutations"]
            if (client.guild) {
              let channel = await client.guild.channels.fetch(channelID)
              if (channel) {
                // @ts-ignore
                await channel?.send(props)
              }
            }
          },
          editReply: async (props) => {
            let channelIDs = require(`./dbs/${process.env.GUILD_ID}/channels.json`)
            let channelID = channelIDs["bot-salutations"]
            if (client.guild) {
              let channel = await client.guild.channels.fetch(channelID)
              if (channel) {
                // @ts-ignore
                await channel?.send(props)
              }
            }
          }
        }
      );
    }
  }
}

// This is the Main Bot Runner
// Print Package version
console.log("")
console.log("---")
console.log("Bot Main:")
console.log(PACKAGE.name, "v" + PACKAGE.version)

// Create CLI structure
program
// Profile Name
  .option(
    "-p, --profile <profile>", "Profile", "default"
  )
  .option(
    "--del", "Delete Commands?", false
  )
  // Parse passed arguments
  .parse(process.argv)

// Gather passed arguments
const options = program.opts()
// console.log("Options")
// console.log(JSON.stringify(options, null, "  "))

let deleteCommands = options.del  // Delete Commands?
let profile = options.profile     // Profile to load
// Pretty-print selections to console
const Table = new AsciiTable("Selected Options", {})
Table.addRow("Selected Profile", profile)
Table.addRow("Delete Commands?", deleteCommands ? "Yes" : "No")
console.log(Table.toString())

// Create RookClient object
const client = new RookClient(
  {
    /**
     * Intents:
     *  Guilds
     *  GuildMembers
     *  GuildMessages
     *  MessageContent
     */
    intents: [
      IntentsBitField.Flags.Guilds,
      IntentsBitField.Flags.GuildMembers,
      IntentsBitField.Flags.GuildMessages,
      IntentsBitField.Flags.MessageContent
    ],
    // All bot to mention roles
    allowedMentions: { parse: ["roles"] }
  },
  // Profile to load
  process.env.ENV_ACTIVE.startsWith("prod") ? "default" : options.profile,
  {
    deleteCommands: deleteCommands,
    DEV: !process.env.ENV_ACTIVE.startsWith("prod")
  }
);

(async () => {
  // Log in Client Object
  await client.login(process.env.TOKEN)

  // Initialize Client Object
  await client.init()

  // Register Events
  console.log("---")
  await eventHandler(client)

  // If this is a GitHub Actions run
  if (process.env.GITHUB_WORKFLOW) {
    console.log(process.env.GITHUB_WORKFLOW)

    // Run Hello
    await callCommands("hello")

    // Set Timeout to call Exit
    setTimeout(async () => {
      try {
        // Run Exit
        let commandNames = [ "exit" ]
        await callCommands(commandNames)
      } catch(err) {
        console.log(err.stack)
      }
    },
    // Do this after 60 seconds
    60 * 1000)
  }
})()
