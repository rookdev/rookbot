// @ts-nocheck

require('@dotenvx/dotenvx').config()
const { IntentsBitField } = require('discord.js')
const { RookClient } = require('./classes/objects/rclient.class')
const eventHandler = require('./handlers/eventHandler')
const { program } = require('commander')
const AsciiTable = require('ascii-table')
const PACKAGE = require("../package.json")

console.log("")
console.log("---")
console.log("Bot Main:")
console.log(PACKAGE.name, "v" + PACKAGE.version)

program
  .option(
    "-p, --profile <profile>", "Profile", "default"
  )
  .parse(process.argv)

const options = program.opts()
// console.log("Options:")
// console.log(JSON.stringify(options, null, "  "))

let profile = options.profile
const Table = new AsciiTable("Selected Options:", {})
Table.addRow("Selected Profile", profile)
console.log(Table.toString())

const client = new RookClient(
  {
    intents: [
      IntentsBitField.Flags.Guilds,
      IntentsBitField.Flags.GuildMembers,
      IntentsBitField.Flags.GuildMessages,
      IntentsBitField.Flags.MessageContent
    ]
  },
  options.profile
);

(async () => {
  // Initialize Client Object
  await client.init()

  // Log in Client Object
  await client.login(process.env.TOKEN)

  // Register Events
  console.log("---")
  await eventHandler(client)
  client.guild = await client.guilds.cache.find(
    g => g.id === client.guildID
  )

  if (process.env.GITHUB_WORKFLOW) {
    console.log(process.env.GITHUB_WORKFLOW)
    setTimeout(async () => {
      const getLocalCommands = require('./utils/getLocalCommands')
      const localCommands = getLocalCommands(client)
      try {
        let commandNames = [ "exit" ]
        for(let commandName of commandNames) {
          const commandObject = localCommands.find(
            cmd => cmd.name === commandName
          )
          if (commandObject) {
            await commandObject.execute(
              client,
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
                    let channel = await client.guild.channels.cache.find(
                      c => c.id === channelID
                    )
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
                    let channel = await client.guild.channels.cache.find(
                      c => c.id === channelID
                    )
                    if (channel) {
                      // @ts-ignore
                      await channel?.send(props)
                    }
                  }
                }
              }
            );
          } else {
            console.log(localCommands)
          }
        }
      } catch(err) {
        console.log(err.stack)
      }
    },
    // 5 * 1000)
    60 * 1000)
  }
})()
