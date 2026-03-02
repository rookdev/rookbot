// @ts-nocheck
// Set up env vars
require('@dotenvx/dotenvx').config()

const DO_FLUXER   = false
const DO_DISCORD  = false
const DO_STOAT    = true

const { REST } = require('@discordjs/rest')
const { WebSocketManager } = require('@discordjs/ws')

// Get Intents bitfields, Partials
const { GatewayIntentBits, IntentsBitField, Partials } = require('discord.js')
// Get RookClient
const { RookClient } = require('./classes/objects/rclient.class')
const { RookFClient } = require('./classes/objects/rfclient.class')
const { RookSClient } = require('./classes/objects/rsclient.class')
// Event Handler
const eventHandler = require('./handlers/eventHandler')
const { program } = require('commander')    // Commander for CLI management
const AsciiTable = require('ascii-table')   // Pretty-print in console
const PACKAGE = require("../package.json")  // Node Package data
const getters = require('./utils/guild/getters')
const emojis = require('./dbs/emojis.json') // Global Emojis

async function callCommands(client, commandNames) {
  if (!typeof commandNames === "object") {
    commandNames = [commandNames]
  }

  // Get local commands
  const getLocalCommands = require('./utils/client/getLocalCommands')
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
              let channel = await getters.getCache(client, client.guild, "channels", channelID)
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
              let channel = await getters.getCache(client, client.guild, "channels", channelID)
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
  .option(
    "--purge", "Purge Commands?", false
  )
  // Parse passed arguments
  .parse(process.argv)

// Gather passed arguments
const options = program.opts()
// console.log("Options")
// console.log(JSON.stringify(options, null, "  "))

let deleteCommands = options.del  // Delete Commands?
let purgeCommands = options.purge // Purge Commands?
let profile = options.profile     // Profile to load
// Pretty-print selections to console
const Table = new AsciiTable("Selected Options", {})
Table.setBorder('|','-','•','•')
Table.addRow("Selected Profile", profile)
Table.addRow("Delete Commands?", deleteCommands ? emojis.check : emojis.nocheck)
Table.addRow("Purge Commands?", purgeCommands ? emojis.check : emojis.nocheck)
console.log(Table.toString())

const clientIntents = [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildInvites,
  GatewayIntentBits.GuildMembers,
  GatewayIntentBits.GuildMessageReactions,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.GuildPresences,
  GatewayIntentBits.GuildVoiceStates,
  GatewayIntentBits.MessageContent
]
const clientPartials = [
  Partials.GuildMember,
  Partials.Message,
  Partials.Reaction,
  Partials.User
]
const clientSettings = {
  /**
   * Intents:
   *  Guilds
   *  GuildMembers
   *  GuildMessages
   *  GuildPresences
   *  GuildVoiceStates
   *  MessageContent
   */
  intents: clientIntents,
  partials: clientPartials,
  // Allow bot to mention roles
  allowedMentions: { parse: ["roles"] }
};

if (DO_FLUXER) {
  (async () => {
    const FLUXER_TOKEN = process.env.FLUXER_TOKEN
    if (FLUXER_TOKEN) {
      // console.log("FLUXER")

      const frest = new REST(
        {
          api:      "https://api.fluxer.app",
          version:  '1'
        }
      ).setToken(FLUXER_TOKEN)

      const fgateway = new WebSocketManager(
        {
          intents: 0,
          frest,
          FLUXER_TOKEN,
          version: '1'
        }
      )

      const fclient = new RookFClient(
        {
          intents: clientIntents,
          frest,
          fgateway
        },
        // Profile to load
        process.env.ENV_ACTIVE.startsWith("prod") ? "default" : options.profile,
        {
          DEV: !process.env.ENV_ACTIVE.startsWith("prod")
        }
      )

      console.log(`${fclient.profile.emojis[fclient.platform]} ${fclient.platform.toUpperCase()}`)

      await fclient.init()
      // console.log(fgateway)
      // await fgateway.connect()

      console.log("---")
      await eventHandler(fclient)
    }
  })();
}

if (DO_DISCORD || process.env.GITHUB_WORKFLOW) {
  (async () => {
    const DISCORD_TOKEN = process.env.TOKEN

    if (DISCORD_TOKEN) {
      // console.log("DISCORD")
      // Create RookClient object
      const client = new RookClient(
        clientSettings,
        // Profile to load
        process.env.ENV_ACTIVE.startsWith("prod") ? "default" : options.profile,
        {
          deleteCommands: deleteCommands,
          purgeCommands: purgeCommands,
          DEV: !process.env.ENV_ACTIVE.startsWith("prod")
        }
      )

      console.log(`${client.profile.emojis[client.platform]} ${client.platform.toUpperCase()}`)

      // Log in Client Object
      await client.login(DISCORD_TOKEN)

      // Initialize Client Object
      await client.init()

      // Register Events
      console.log("---")
      await eventHandler(client)

      // If this is a GitHub Actions run
      if (process.env.GITHUB_WORKFLOW) {
        console.log(process.env.GITHUB_WORKFLOW)

        // Run Hello
        await callCommands(client, "hello")

        // Set Timeout to call Exit
        setTimeout(async () => {
          try {
            // Run Exit
            let commandNames = [ "exit" ]
            await callCommands(client, commandNames)
          } catch(err) {
            console.log(err.stack)
          }
        },
        // Do this after 60 seconds
        60 * 1000)
      }
    }
  })();
}

if (DO_STOAT) {
  (async () => {
    const STOAT_TOKEN = process.env.STOAT_TOKEN

    if (STOAT_TOKEN) {
      // console.log("STOAT")
      // Create RookClient object
      const sclient = new RookSClient(
        clientSettings,
        // Profile to load
        process.env.ENV_ACTIVE.startsWith("prod") ? "default" : options.profile,
        {
          DEV: !process.env.ENV_ACTIVE.startsWith("prod")
        }
      )

      console.log(`${sclient.profile.emojis[sclient.platform]} ${sclient.platform.toUpperCase()}`)

      // Log in Client Object
      await sclient.login(STOAT_TOKEN)

      // // Initialize Client Object
      // await sclient.init()

      // Register Events
      console.log("---")
      await eventHandler(sclient)
    }
  })();
}
