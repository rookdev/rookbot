// @ts-nocheck

// Command Option Types, Formatters: bold, italic
const { ApplicationCommandOptionType, bold, italic } = require('discord.js')
const SeedMetaCommand = require('./seedmeta')
const { RookCommand } = require('../../classes/command/rcommand.class')
const getSeedFields = require('../../utils/getSeedFields')
const timeFormat = require('../../utils/timeFormat')
const randFuncs = require('../../utils/randFuncs')
const strtotime = require('locutus/php/datetime/strtotime')
const numFuncs = require('../../utils/numFuncs')
const path = require('path')
const fs = require('fs')

function article(input="") {
  for (let vowel of "aeiou".split("")) {
    if (input.toLowerCase().startsWith(vowel)) {
      return "an"
    }
  }

  return "a"
}

function isValidURLFromDomain(input, domain) {
  try {
    // Parse the input string as a URL
    const url = new URL(input)

    // Check if the hostname and protocol match the expected domain
    const expectedUrl = new URL(domain)
    return (url.hostname === expectedUrl.hostname)
  } catch (error) {
    // If URL constructor throws, the input is not a valid URL
    return false
  }
}

module.exports = class SeedAnnounceCommand extends RookCommand {
  constructor(client, comprops, props) {
    comprops = comprops || {
      name: "seedannounce",
      category: "rando",
      description: "Starts a specified Randomizer Game with all necessary details",
      options: [
        {
          name: "randomizer",
          description: "Randomizer to choose",
          type: ApplicationCommandOptionType.String,
          choices: [
            {
              name:   "A Link to the Past Randomizer",
              value:  "z3r"
            },
            {
              name:   "Super Metroid + A Link to the Past Combination Randomizer",
              value:  "z3m3"
            },
            {
              name:   "Super Metroid Map Randomizer",
              value:  "m3maprando"
            },
            // {
            //   name:   "Quad Randomizer",
            //   value:  "z1m1z3m3"
            // },
            {
              name:   "Archipelago",
              value:  "ap"
            }
          ],
          required: true
        },
        {
          name: "ping-multiplayer-role",
          description: "Whether or not to ping the Multiplayer Ping role",
          type: ApplicationCommandOptionType.Boolean
        },
        {
          name: "pingable-role-id",
          description: "Role ID number to ping",
          type: ApplicationCommandOptionType.String
        },
        {
          name: 'seed-url',
          description: 'The URL of the seed to play',
          type: ApplicationCommandOptionType.String
        },
        {
          name: 'prep-time',
          description: 'The number of minutes to prepare before the game starts.',
          type: ApplicationCommandOptionType.Integer,
          minValue: 0,
          maxValue: 10080
        },
        {
          name: 'scheduled-time',
          description: 'A parsesable DateTime for when to schedule this game',
          type: ApplicationCommandOptionType.String
        },
        {
          name: 'group-id',
          description: 'Group ID number',
          type: ApplicationCommandOptionType.String
        }
      ],
      testOptions: [
        {},
        // Rando
        // Rando & Ping
        // Rando & Seed URL
        // Rando & Prep Time
        // Rando & Group ID
        // Rando & Start Time
        { randomizer: "z3r" },
        { randomizer: "z3r", "ping-multiplayer-role": true },
        { randomizer: "z3r", "seed-url": "https://alttpr.com/h/0yAONb6XMV" },
        { randomizer: "z3r", "prep-time": 60 },
        { randomizer: "z3r", "scheduled-time": "3155760000" },
        { randomizer: "z3r", "group-id": "1983" },
        { randomizer: "z3m3" },
        { randomizer: "z3m3", "ping-multiplayer-role": true },
        { randomizer: "z3m3", "seed-url": "https://samus.link/seed/q8q8Z5NMQlGiSYgqPHKTkA" },
        { randomizer: "z3m3", "prep-time": 60 },
        { randomizer: "z3m3", "scheduled-time": "3155760000" },
        { randomizer: "z3m3", "group-id": "1983" },
        // { randomizer: "z1m1z3m3" },
        // { randomizer: "z1m1z3m3", "ping-multiplayer-role": true },
        // { randomizer: "z1m1z3m3", "seed-url": "https://quad.beta.samus.link/seed/MOaOZII0QzS80DG9VTluXw" },
        // { randomizer: "z1m1z3m3", "prep-time": 60 },
        // { randomizer: "z1m1z3m3", "scheduled-time": "3155760000" },
        // { randomizer: "z1m1z3m3", "group-id": "1983" },
        { randomizer: "m3maprando" },
        { randomizer: "m3maprando", "ping-multiplayer-role": true },
        { randomizer: "m3maprando", "seed-url": "https://maprando.com/seed/wPvtmGMpc" },
        { randomizer: "m3maprando", "prep-time": 60 },
        { randomizer: "m3maprando", "scheduled-time": "3155760000" },
        { randomizer: "m3maprando", "group-id": "1983" }
      ],
      aliases: [
        // ALttPR
        {
          name: "z3r",
          description: "Starts a Z3R Game with all necessary details",
          options: { randomizer: "z3r" }
        },
        {
          name: "alttpr",
          description: "Starts a Z3R Game with all necessary details",
          options: { randomizer: "z3r" }
        },

        // M3MapRando
        {
          name: "smmr",
          description: "Starts a Super Metroid Map Randomizer Game with all necessary details",
          options: { randomizer: "m3maprando" }
        },

        // SMALttPR
        {
          name: "z3m3",
          description: "Starts a Z3M3 Game with all necessary details",
          options: { randomizer: "z3m3" }
        },
        {
          name: "smz3",
          description: "Starts a Z3M3 Game with all necessary details",
          options: { randomizer: "z3m3" }
        },

        // Quad
        // {
        //   name: "quad",
        //   description: "Starts a Quad Randomizer Game with all necessary details",
        //   options: { randomizer: "z1m1z3m3" }
        // },

        // Archipelago
        {
          name: "ap",
          description: "Starts an Archipelago Game with all necessary details",
          options: { randomizer: "ap" }
        }
      ]
    }
    props = props || {}
    super(
      client,
      {...comprops},
      {...props}
    )
  }

  // declare props: import('../../types/embed').EmbedProps

  async action(client, interaction, coptions) {
    // Get GameID
    const randomizer = coptions.randomizer ?? "z3m3"

    // Ping role?
    const pingMultiplayerRole = coptions['ping-multiplayer-role'] ?? false // Default to false
    // Role to ping
    let roleID = coptions['pingable-role-id'] ?? 0
    // Seed URL
    const seedURL = coptions['seed-url'] ?? null
    // Prep time length
    const prepTimeMinutes = coptions['prep-time'] ?? 5 // Default to 5 minutes
    // Scheduled Time
    const scheduledTime = coptions['scheduled-time'] ?? null

      /*
    const sahaBot = await interaction.guild.members.fetch(userIDs['sahabot'])

    if (!sahaBot) {
      let intOptions = {
        content: `SahasrahBot not found on this server. <@${userIDs['sahabot']}>`,
        flags: MessageFlags.Ephemeral
      }
      await interaction.reply(intOptions)
      return
    }*/

    // Generate random group name
    const randNum = coptions['group-id'] ?? randFuncs.myRand(10000000001)
    const groupName = `zdoi${randNum}`

    // Get the current timestamp and add <prepTimeMinutes> minutes of prep time
    const now = new Date()

    // Clear message content
    this.content = ""

    // Get calculated start time
    const prepTime = prepTimeMinutes * 60 * 1000 // Convert minutes to milliseconds
    let adjustedDateTime = new Date(now.getTime() + prepTime)

    // If we received a scheduled time, use that instead
    if (scheduledTime) {
      let scheduledDateTime = null
      if (numFuncs.myIsNumeric(scheduledTime)) {
        console.log(`Numeric: ${scheduledTime}`)
        scheduledDateTime = new Date(parseInt(scheduledTime))
      } else {
        console.log(`Not Numeric: ${scheduledTime}`)
        scheduledDateTime = strtotime(scheduledTime)
      }
      if (!scheduledDateTime) {
        this.error = true
        this.props.description = `Couldn't figure out a DateTime from '${scheduledTime}'.`
        return false
      }
      adjustedDateTime = scheduledDateTime
    }

    // Get Rando Database file
    let randoDataPath = path.join(
      __dirname,
      "..",
      "..",
      "dbs",
      "randos",
      `${randomizer}.json`
    )
    // If it doesn't exist, bail
    if (!fs.existsSync(randoDataPath)) {
      this.error = true
      this.props.description = `Randomizer Database file for '${randomizer}' not found!`
      return false
    }

    // Get the data
    const randoData = require(randoDataPath)
    // Get the title
    const randoTitle = randoData?.rando?.player?.name ?? randomizer
    // Get Major Items
    const majorItems = randoData?.madlibs?.major      ?? []
    // Get Useless Items
    const uselessItems = randoData?.madlibs?.useless  ?? []
    // Get Footers
    const footerTexts = randoData?.madlibs?.footers   ?? []

    // Get Pingable Role ID
    roleID = randoData?.rando["pingable-role-id"] ?? roleID

    // Set Title
    this.props.title = {
      text: `${randoTitle} Game Details`
    }

    // Select a random footer text
    var randomFooterText = randFuncs.randPick(footerTexts) ?? ""

    // Select a random major item
    const randomMajorItem = randFuncs.randPick(majorItems) ?? ""
    const randomUselessItem = randFuncs.randPick(uselessItems) ?? ""

    // Modify the major item if it starts with "A " and if it's not at the beginning of the sentence
    let formattedMajorItem = randomMajorItem ?? ""
    if (formattedMajorItem.startsWith('A ') && randomFooterText.indexOf('[MAJOR_ITEM]') > 0) {
      // Only lowercase the first letter if '[MAJOR_ITEM]' is in the middle
      formattedMajorItem = formattedMajorItem.charAt(0).toLowerCase() + formattedMajorItem.slice(1)
    }

    // Replace '[MAJOR_ITEM]' with the modified major item
    randomFooterText = randomFooterText.replace('[MAJOR_ITEM]', formattedMajorItem)

    // Replace '[USELESS_ITEM]' with the modified major item
    randomFooterText = randomFooterText.replace('[USELESS_ITEM]', randomUselessItem)

    // Create the embed
    this.props.playerTypes = {
      user: "bot",
      target: "caller"
    }
    if (randoData?.rando?.player?.avatar) {
      this.props.image = { image: randoData?.rando?.player?.avatar }
    }

    let fields = []
    this.props.description = []

    if (randomFooterText != "") {
      this.props.footer = {
        text: randomFooterText
      }
    }

    // Construct the content for the channel message
    // Get the Pinger role
    let roleObject = null
    if (pingMultiplayerRole) {
      let roleIDs = {}
      let roleIDsPath = path.join(
        __dirname,
        '..',
        '..',
        'dbs',
        interaction?.guild?.id,
        'roleIDs.json'
      )
      if (fs.existsSync(roleIDsPath)) {
        roleIDs = require(roleIDsPath)
        // If no role, try the one listed in the guild DB
        if ((roleID == 0) && (roleIDs["pingable-multiplayer-role"])) {
          roleID = roleIDs["pingable-multiplayer-role"]
        }
      }

      if (roleID != 0) {
        // If we've got a role, try to find it
        roleObject = await interaction?.guild?.roles.fetch(roleID)
        if (!roleObject) {
          this.error = true
          this.props.description = `Role doesn't exist in ${italic(interaction?.guild?.name)} with ID of '${roleID}'.`
          return false
        }
      }
    }

    // Build the Pinger
    if (pingMultiplayerRole && roleObject && (roleID != 0)) {
      this.content = `<@&${roleID}>`
      this.props.description.push("🔔")
    }

    // Add the Announcement
    let announcement = article(randoTitle).ucfirst() + ` ${randoTitle} game has been generated!`
    this.content += " " + announcement

    // Add the Permalink
    if (seedURL && seedURL.endsWith("/")) {
      seedURL = seedURL.substring(0,seedURL.length - 1)
    }
    if (
      isValidURLFromDomain(
        seedURL,
        randoData.rando.permalink
      )
    ) {
      this.props.description.push(
        `🔗You can download it from here: ${seedURL}`
      )

      // Get metadata fields
      let hashID = seedURL.split("/")
      hashID = hashID[hashID.length - 1]
      this.props.fields = await getSeedFields(hashID, randomizer)
    } else {
      // No permalink, no fields
      this.props.fields = []
    }

    this.props.description.push(
      ""  // A blank space, baby
    )

    // Group Name
    this.props.description.push(
      bold('Group Name'),
      groupName,
      ""  // A blank space, baby
    )

    // Scripts
    if (randoData?.rando?.scripts && randoData?.rando?.scripts?.length > 0) {
      this.props.description.push(
        bold(`Scripts`),
        randoData?.rando?.scripts,
        ""  // A blank space, baby
      )
    }

    // Start Game Reminder
    this.props.description.push(
      'Start Game Reminder'.boldUnderline(),
      'Please wait on the Start Game with everyone until the game begins.',
      ""  // A blank space, baby
    )

    // Game Start Time
    this.props.description.push(
      bold('Game Start Time'),
      `The game will begin at ${timeFormat(adjustedDateTime.getTime())} which is ${timeFormat(adjustedDateTime.getTime(), { relative: true })}.`
      // No blank space, baby
    )

    return !this.error
  }
}
