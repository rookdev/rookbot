// @ts-nocheck

// Command Option Types, Formatters: bold, italic, userMention, roleMention
const { ApplicationCommandOptionType, bold, italic, inlineCode, userMention, roleMention, hyperlink } = require('discord.js')
const SeedMetaCommand = require('./seedmeta')
const { RookCommand } = require('../../classes/command/rcommand.class')
const autodetectRando = require('../../utils/rando/autodetectRando')
const getSeedFields = require('../../utils/rando/getSeedFields')
const mentionFuncs = require('../../utils/formatters/mentions')
const timeFormat = require('../../utils/formatters/timeFormat')
const fileFuncs = require('../../utils/fs/fileFuncs')
const randFuncs = require('../../utils/primitives/randFuncs')
const numFuncs = require('../../utils/primitives/numFuncs')
const dbFuncs = require('../../utils/db/dbFuncs')
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
        // Rando & Ping
        // Rando & Prep Time
        // Rando & Start Time
        // Rando & Group ID
        { "seed-url": "https://alttpr.com/h/0yAONb6XMV", "ping-multiplayer-role": true },
        { "seed-url": "https://alttpr.com/h/0yAONb6XMV", "prep-time": 60 },
        { "seed-url": "https://alttpr.com/h/0yAONb6XMV", "scheduled-time": "3155760000" },
        { "seed-url": "https://alttpr.com/h/0yAONb6XMV", "group-id": "1983" },
        { "seed-url": "https://samus.link/seed/q8q8Z5NMQlGiSYgqPHKTkA", "ping-multiplayer-role": true },
        { "seed-url": "https://samus.link/seed/q8q8Z5NMQlGiSYgqPHKTkA", "prep-time": 60 },
        { "seed-url": "https://samus.link/seed/q8q8Z5NMQlGiSYgqPHKTkA", "scheduled-time": "3155760000" },
        { "seed-url": "https://samus.link/seed/q8q8Z5NMQlGiSYgqPHKTkA", "group-id": "1983" },
        { "seed-url": "https://quad.beta.samus.link/seed/MOaOZII0QzS80DG9VTluXw", "ping-multiplayer-role": true },
        { "seed-url": "https://quad.beta.samus.link/seed/MOaOZII0QzS80DG9VTluXw", "prep-time": 60 },
        { "seed-url": "https://quad.beta.samus.link/seed/MOaOZII0QzS80DG9VTluXw", "scheduled-time": "3155760000" },
        { "seed-url": "https://quad.beta.samus.link/seed/MOaOZII0QzS80DG9VTluXw", "group-id": "1983" },
        { "seed-url": "https://quad.samus.link/seed/taMbuylcr1ufQm6K", "ping-multiplayer-role": true },
        { "seed-url": "https://quad.samus.link/seed/taMbuylcr1ufQm6K", "prep-time": 60 },
        { "seed-url": "https://quad.samus.link/seed/taMbuylcr1ufQm6K", "scheduled-time": "3155760000" },
        { "seed-url": "https://quad.samus.link/seed/taMbuylcr1ufQm6K", "group-id": "1983" },
        { "seed-url": "https://maprando.com/seed/wPvtmGMpc", "ping-multiplayer-role": true },
        { "seed-url": "https://maprando.com/seed/wPvtmGMpc", "prep-time": 60 },
        { "seed-url": "https://maprando.com/seed/wPvtmGMpc", "scheduled-time": "3155760000" },
        { "seed-url": "https://maprando.com/seed/wPvtmGMpc", "group-id": "1983" },
        { "seed-url": "https://variabeta.pythonanywhere.com/customizer/50098285-a918-4a2f-96bc-8e97c47ea410", "ping-multiplayer-role": true },
        { "seed-url": "https://variabeta.pythonanywhere.com/customizer/50098285-a918-4a2f-96bc-8e97c47ea410", "prep-time": 60 },
        { "seed-url": "https://variabeta.pythonanywhere.com/customizer/50098285-a918-4a2f-96bc-8e97c47ea410", "scheduled-time": "3155760000" },
        { "seed-url": "https://variabeta.pythonanywhere.com/customizer/50098285-a918-4a2f-96bc-8e97c47ea410", "group-id": "1983" },
        { "seed-url": "https://mxfrando.com/seed/UVVBUk5USU4gU0EtWCBBUkFOIENIQVJHRQ//", "ping-multiplayer-role": true },
        { "seed-url": "https://mxfrando.com/seed/UVVBUk5USU4gU0EtWCBBUkFOIENIQVJHRQ//", "prep-time": 60 },
        { "seed-url": "https://mxfrando.com/seed/UVVBUk5USU4gU0EtWCBBUkFOIENIQVJHRQ//", "scheduled-time": "3155760000" },
        { "seed-url": "https://mxfrando.com/seed/UVVBUk5USU4gU0EtWCBBUkFOIENIQVJHRQ//", "group-id": "1983" }
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
    // Role to ping
    let roleID = coptions['pingable-role-id'] ?? 0
    // Seed URL
    let seedURL = coptions['seed-url'] ?? null
    // Prep time length
    const prepTimeMinutes = coptions['prep-time'] ?? 5 // Default to 5 minutes
    // Scheduled Time
    let scheduledTime = coptions['scheduled-time'] ?? null

    const [randomizer, hashID, permalinkURL] = await autodetectRando(seedURL)
    if (permalinkURL) {
      seedURL = permalinkURL
    }

      /*
    const sahaBot = await interactionGuild.members.fetch(userIDs['sahabot'])

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
    const groupName = (typeof randNum == "string" && randNum.startsWith("zdoi")) ? randNum : `zdoi${randNum}`

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
        // this.messages.push(`Numeric: ${scheduledTime}`)
        scheduledDateTime = moment.utc(parseInt(scheduledTime))
      } else {
        // this.messages.push(`Not Numeric: ${scheduledTime}`)
        let hammerTimePattern = /\<t\:([\d]+)\:[^\>]\>/
        let matches = scheduledTime.match(hammerTimePattern)
        if (matches) {
          // this.messages.push(matches)
          scheduledTime = matches[1]
          let platoError = (scheduledTime + "").length - 10
          let adjustedStamp = scheduledTime
          if (platoError > 0) {
            adjustedStamp = Math.floor(scheduledTime / Math.pow(10, platoError))
            scheduledTime = adjustedStamp
          }
          scheduledDateTime = parseInt(scheduledTime)
        }
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

    // this.messages.push(
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
    let interactionGuild = await this.getGuild(client, interaction)
    // DB
    let dbRes = await dbFuncs.getDB(
      interactionGuild.id,
      "roleIDs"
    )
    let roleIDs = dbRes[0]
    let messages = dbRes[1]
    // /DB

    if (roleIDs) {
      // If no role, try the one listed in the guild DB
      if (roleID == 0) {
        if (roleIDs[randomizer]) {
          this.messages.push(`Found Game-Specific Pingable Role ID for ${mentionFuncs.guildMention(interactionGuild.name, interactionGuild.id, { showID: true, oneLine: true, textOnly: true })}`)
          roleID = roleIDs[randomizer]
        } else if (roleIDs["pingable-multiplayer-role"]) {
          this.messages.push(`Found Pingable Role ID for ${mentionFuncs.guildMention(interactionGuild.name, interactionGuild.id, { showID: true, oneLine: true, textOnly: true })}`)
          roleID = roleIDs["pingable-multiplayer-role"]
        }          
      }
    }

    if (roleID != 0) {
      // If we've got a role, try to find it
      roleID = roleID.replace(/[<#@&!>]/g, '')
      if (["stoat"].includes(client.platform)) {
        roleObject = await interactionGuild.roles.cache.get(roleID)
      } else {
        roleObject = await this.getCache(client, interactionGuild, "roles", roleID)
      }
      if (!roleObject) {
        this.error = true
        this.messages.push(`Role doesn't exist in '${interactionGuild.name}' with ID of '${roleID}'`)
        this.props.description = `Role doesn't exist in ${italic(interactionGuild?.name)} with ID of '${roleID}'.`
        return false
      } else {
        this.messages.push(`Role Found`)
      }
    }

    // Build the Pinger
    if (roleObject && (roleID != 0)) {
      this.messages.push("Do Ping")
      this.content = roleMention(roleID)
      this.messages.push(`Role Ping: On`)
      this.props.description.push(`🔔${roleMention(roleID)}`)
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
      this.props.fields = await getSeedFields(hashID, randomizer, permalinkURL)
    } else {
      // No permalink, no fields
      this.props.fields = []
    }

    this.props.description.push(
      ""  // A blank space, baby
    )

    // Setup
    let setupLink = ""
    if (interactionGuild.name.indexOf("ZDoI") > -1) {
      let setupLinks = {
        "m3maprando": "https://discord.com/channels/1450159772622913628/1465896350465130546/1465896350465130546",
        "z3m3": "https://discord.com/channels/1450159772622913628/1465896350465130546/1465896350465130546"
      }
      if (Object.keys(setupLinks).indexOf(randomizer) > -1) {
        setupLink = setupLinks[randomizer]
      }
    }
    if (setupLink != "") {
      this.props.description.push(
        hyperlink(
          bold("Setup Help"),
          setupLink
        ),
        "" // A blank space, baby
      )
    }

    // Group Name
    this.props.description.push(
      bold('Group Name'),
      inlineCode(groupName),
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
      bold('Start Game Reminder'),
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
