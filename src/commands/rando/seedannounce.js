// @ts-nocheck

// Command Option Types, Formatters: bold, italic, userMention, roleMention
const { ApplicationCommandOptionType, bold, italic, userMention, roleMention } = require('discord.js')
const SeedMetaCommand = require('./seedmeta')
const { RookCommand } = require('../../classes/command/rcommand.class')
const getSeedFields = require('../../utils/rando/getSeedFields')
const timeFormat = require('../../utils/formatters/timeFormat')
const fileFuncs = require('../../utils/fs/fileFuncs')
const randFuncs = require('../../utils/primitives/randFuncs')
const numFuncs = require('../../utils/primitives/numFuncs')
const moment = require('moment')

function article(input="") {
  for (let vowel of "aeiou".split("")) {
    if (input.toLowerCase().startsWith(vowel)) {
      return "an"
    }
  }

  return "a"
}

function isValidURLFromDomain(input, domain) {
  let valid = false

  if (typeof domain != "object") {
    domain = [domain]
  }

  for (let pattern of domain) {
    if (!valid) {
      try {
        // Parse the input string as a URL
        const url = new URL(input)

        // Check if the hostname and protocol match the expected pattern
        const expectedUrl = new URL(pattern)
        valid = (url.hostname === expectedUrl.hostname)
      } catch (error) {
        // If URL constructor throws, the input is not a valid URL
        valid = false
      }
    }
  }

  return valid
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
            {
              name:   "Super Metroid VARIA Randomizer",
              value:  "varia"
            },
            {
              name:   "Super Metroid X-Fusion Randomizer",
              value:  "m4xfr"
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
        { randomizer: "z1m1z3m3" },
        { randomizer: "z1m1z3m3", "ping-multiplayer-role": true },
        { randomizer: "z1m1z3m3", "seed-url": "https://quad.beta.samus.link/seed/MOaOZII0QzS80DG9VTluXw" },
        { randomizer: "z1m1z3m3", "prep-time": 60 },
        { randomizer: "z1m1z3m3", "scheduled-time": "3155760000" },
        { randomizer: "z1m1z3m3", "group-id": "1983" },
        { randomizer: "m3maprando" },
        { randomizer: "m3maprando", "ping-multiplayer-role": true },
        { randomizer: "m3maprando", "seed-url": "https://maprando.com/seed/wPvtmGMpc" },
        { randomizer: "m3maprando", "prep-time": 60 },
        { randomizer: "m3maprando", "scheduled-time": "3155760000" },
        { randomizer: "m3maprando", "group-id": "1983" },
        { randomizer: "varia" },
        { randomizer: "varia", "ping-multiplayer-role": true },
        { randomizer: "varia", "seed-url": "https://variabeta.pythonanywhere.com/customizer/50098285-a918-4a2f-96bc-8e97c47ea410" },
        { randomizer: "varia", "seed-url": "https://variabeta.pythonanywhere.com/customizer/50098285-a918-4a2f-96bc-8e97c47ea410?msg=%27Suits%20restriction%27%20forced%20to%20off" },
        { randomizer: "varia", "prep-time": 60 },
        { randomizer: "varia", "scheduled-time": "3155760000" },
        { randomizer: "varia", "group-id": "1983" },
        { randomizer: "m4xfr" },
        { randomizer: "m4xfr", "ping-multiplayer-role": true },
        { randomizer: "m4xfr", "seed-url": "https://castie.ddns.net/xf_rando/seed/VE9YSUMgQk9NQiBIT1JOVE8gVEFOSw/" },
        { randomizer: "m4xfr", "prep-time": 60 },
        { randomizer: "m4xfr", "scheduled-time": "3155760000" },
        { randomizer: "m4xfr", "group-id": "1983" }
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

        // VARIA
        {
          name: "varia",
          description: "Starts a Super Metroid VARIA Randomizer Game with all necessary details",
          options: { randomizer: "varia" }
        },

        // M4XFR
        {
          name: "m4xfr",
          description: "Starts a Super Metroid X-Fusion Randomizer Game with all necessary details",
          options: { randomizer: "m4xfr" }
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
    const doPing = coptions['ping-multiplayer-role'] ?? false // Default to false
    // Role to ping
    let roleID = coptions['pingable-role-id'] ?? 0
    // Seed URL
    let seedURL = coptions['seed-url'] ?? null
    // Prep time length
    const prepTimeMinutes = coptions['prep-time'] ?? 5 // Default to 5 minutes
    // Scheduled Time
    const scheduledTime = coptions['scheduled-time'] ?? null

      /*
    const sahaBot = await interaction.guild.members.fetch(userIDs['sahabot'])

    if (!sahaBot) {
      let intOptions = {
        content: `SahasrahBot not found on this server. ${userMention(userIDs['sahabot'])}`,
        flags: MessageFlags.Ephemeral
      }
      await interaction.reply(intOptions)
      return
    }*/

    // Generate random group name
    const randNum = coptions['group-id'] ?? randFuncs.myRand(10000000001)
    const groupName = `zdoi${randNum}`

    // Get the current timestamp and add <prepTimeMinutes> minutes of prep time
    const now = moment.utc()

    // Clear message content
    this.content = ""

    // Get calculated start time
    const prepTime = prepTimeMinutes * 60 * 1000 // Convert minutes to milliseconds
    let adjustedDateTime = moment.utc(parseInt(now.format("x")) + prepTime)

    // If we received a scheduled time, use that instead
    if (scheduledTime) {
      let scheduledDateTime = null
      if (numFuncs.myIsNumeric(scheduledTime)) {
        // console.log(`Numeric: ${scheduledTime}`)
        scheduledDateTime = moment.utc(parseInt(scheduledTime))
      } else {
        // console.log(`Not Numeric: ${scheduledTime}`)
        scheduledDateTime = strtotime(scheduledTime)
      }
      if (!scheduledDateTime) {
        this.error = true
        this.props.description = `Couldn't figure out a DateTime from '${scheduledTime}'.`
        return false
      }
      adjustedDateTime = moment.utc(scheduledDateTime)
    }

    // Get the data
    const randoData = fileFuncs.getAFile(
      [
        "src",
        "dbs",
        "randos"
      ],
      `${randomizer}.json`
    )
    // If it doesn't exist, bail
    if (!randoData) {
      this.error = true
      this.props.description = `Randomizer Database file for '${randomizer}' not found!`
      return false
    }

    // Get the title
    const randoTitle = randoData?.rando?.player?.name ?? randomizer

    // Get the madlibs
    let madlibs = {}
    for (let gameID of randoData?.madlibs) {
      const gameLibs = fileFuncs.getAFile(
        [
          "src",
          "dbs",
          "randos",
          "madlibs"
        ],
        `${gameID}.json`
      )
      for (let [key, libs] of Object.entries(gameLibs)) {
        if (madlibs[key]) {
          madlibs[key] = [...madlibs[key], ...libs]
        } else {
          madlibs[key] = libs
        }
      }
    }

    // Get Text pieces
    const textPieces = {
      major_item: [],
      useless_item: [],
      blessed_location: [],
      cursed_location: [],
      speed_tech: [],
      footers: []
    }

    // Collect selected Text pieces
    let gotPiece = {}

    // Cycle through Text pieces
    for (let textType of Object.keys(textPieces)) {
      gotPiece[textType] = null
      // If this rando has this piece type
      if (madlibs[textType]) {
        // Store collection for later
        textPieces[textType] = madlibs[textType]
        textPieces[textType] = [...new Set(textPieces[textType])]
      }
    }

    // Get Pingable Role ID
    roleID = randoData?.rando["pingable-role-id"] ?? roleID

    // Set Title
    this.props.title = {
      text: `${randoTitle} Game Details`
    }

    let randomFooterText = ""
    if (textPieces?.footers) {
      randomFooterText = randFuncs.randPick(textPieces?.footers)
      gotPiece.footers = randomFooterText

      // Modify the major item if it starts with "A " and if it's not at the beginning of the sentence
      let formattedMajorItem = gotPiece?.major_item ?? ""
      if (
        formattedMajorItem != "" &&
        formattedMajorItem.startsWith('A ') &&
        randomFooterText.indexOf('[MAJOR_ITEM]') > 0
      ) {
        // Only lowercase the first letter if '[MAJOR_ITEM]' is in the middle
        formattedMajorItem = formattedMajorItem.charAt(0).toLowerCase() + formattedMajorItem.slice(1)
      }
      gotPiece.major_item = formattedMajorItem

      for (let rKey of Object.keys(textPieces)) {
        const search = `[${rKey.toUpperCase()}]`
        if (randomFooterText.includes(search)) {
          gotPiece[rKey] = randFuncs.randPick(textPieces[rKey])
          randomFooterText = randomFooterText.replace(search, gotPiece[rKey])
        }
      }
    }

    // console.log(
    //   textPieces,
    //   gotPiece
    // )

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
    if (doPing) {
      console.log("Do Ping")
      let roleIDs = fileFuncs.getAFile(
        [
          "src",
          "dbs",
          interaction?.guild?.id
        ],
        "roleIDs.json"
      )
      if (roleIDs) {
        // If no role, try the one listed in the guild DB
        if ((roleID == 0) && (roleIDs["pingable-multiplayer-role"])) {
          console.log(`Found Pingable Role ID [${interaction.guild.id}] for '${interaction.guild.name}'`)
          roleID = roleIDs["pingable-multiplayer-role"]
        }
      }

      if (roleID != 0) {
        // If we've got a role, try to find it
        roleID = roleID.replace(/[<#@&!>]/g, '')
        roleObject = await interaction?.guild?.roles.fetch(roleID)
        if (!roleObject) {
          this.error = true
          console.log(`Role doesn't exist in '${interaction.guild.name}' with ID of '${roleID}'`)
          this.props.description = `Role doesn't exist in ${italic(interaction?.guild?.name)} with ID of '${roleID}'.`
          return false
        } else {
          console.log(`Role Found`)
        }
      }
    }

    // Build the Pinger
    if (doPing && roleObject && (roleID != 0)) {
      this.content = roleMention(roleID)
      console.log(`Role Ping: On`)
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
        randoData.rando?.permalink
      )
    ) {
      this.props.description.push(
        `🔗You can download it from here: ${seedURL}`
      )

      // Get metadata fields
      if (seedURL.endsWith("/")) {
        seedURL = seedURL.substring(0, seedURL.length - 1)
      }
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
      `The game will begin at ${timeFormat(adjustedDateTime.format("x"))} which is ${timeFormat(adjustedDateTime.format("x"), { relative: true })}.`
      // No blank space, baby
    )

    return !this.error
  }
}
