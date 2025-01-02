// @ts-nocheck

const { ApplicationCommandOptionType } = require('discord.js')
const SeedMetaCommand = require('./seedmeta.js')
const { RookCommand } = require('../../classes/command/rcommand.class')
const getSeedFields = require('../../utils/getSeedFields.js')
const timeFormat = require('../../utils/timeFormat.js')
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
          type: ApplicationCommandOptionType.Integer
        }
      ],
      testOptions: [
        {},
        { randomizer: "z3r" },
        { randomizer: "z3r", "ping-multiplayer-role": true },
        { randomizer: "z3r", "seed-url": "https://alttpr.com/h/0yAONb6XMV" },
        { randomizer: "z3r", "prep-time": 60 },
        { randomizer: "z3m3" },
        { randomizer: "z3m3", "ping-multiplayer-role": true },
        { randomizer: "z3m3", "seed-url": "https://samus.link/seed/q8q8Z5NMQlGiSYgqPHKTkA" },
        { randomizer: "z3m3", "prep-time": 60 },
        { randomizer: "m3maprando" },
        { randomizer: "m3maprando", "ping-multiplayer-role": true },
        { randomizer: "m3maprando", "seed-url": "https://maprando.com/seed/wPvtmGMpc" },
        { randomizer: "m3maprando", "prep-time": 60 },
      ],
      aliases: [
        {
          name: "z3r",
          description: "Starts a Z3R Game with all necessary details",
          options: { randomizer: "z3r" }
        },
        {
          name: "smmr",
          description: "Starts a Super Metroid Map Randomizer Game with all necessary details",
          options: { randomizer: "m3maprando" }
        },
        {
          name: "z3m3",
          description: "Starts a Z3M3 Game with all necessary details",
          options: { randomizer: "z3m3" }
        },
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
    const randomizer = coptions.randomizer || "z3m3"

    const pingMultiplayerRole = coptions['ping-multiplayer-role'] ?? false // Default to false
    let roleID = coptions['pingable-role-id'] ?? 0
    const seedURL = coptions['seed-url'] ?? null
    const prepTimeMinutes = coptions['prep-time'] ?? 5 // Default to 5 minutes

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

    // Defer reply silently

    try {
      // Generate random group name
      const randNum = Math.floor(Math.random() * 10000000001)
      const groupName = `zdoi${randNum}`

      // Get the current timestamp and add <prepTimeMinutes> minutes of prep time
      const now = new Date()

      const maxAllowedMinutes = 10080
      if (prepTimeMinutes > maxAllowedMinutes) {
        this.error = true
        // Respond with an error message if something goes wrong
        this.props.title = {
          text: "Invalid Prep Time Duration"
        }
        this.props.description = `Exceeded max duration of ${maxAllowedMinutes} minutes (1 week). Please try again.`
      } else if (prepTimeMinutes < 0) {
        this.error = true
        // Respond with an error message if something goes wrong
        this.props.title = {
          text: "Invalid Prep Time Duration"
        }
        this.props.description = `Duration ${prepTimeMinutes} minutes **may not be negative**. Please try again.`
      }

      const prepTime = prepTimeMinutes * 60 * 1000 // Convert minutes to milliseconds
      const adjustedDateTime = new Date(now.getTime() + prepTime)

      const randoData = require(`../../dbs/randos/${randomizer}.json`)
      const randoTitle = randoData.rando.player.name
      const majorItems = randoData.madlibs.major
      const uselessItems = randoData.madlibs.useless
      const footerTexts = randoData.madlibs.footers

      this.props.title = {
        text: `${randoTitle} Game Details`
      }

      // Select a random footer text
      var randomFooterText = footerTexts[Math.floor(Math.random() * footerTexts.length)] || ""

      // Select a random major item
      const randomMajorItem = majorItems[Math.floor(Math.random() * majorItems.length)] || ""
      const randomUselessItem = uselessItems[Math.floor(Math.random() * uselessItems.length)] || ""

      // Modify the major item if it starts with "A " and if it's not at the beginning of the sentence
      let formattedMajorItem = randomMajorItem || ""
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
      this.props.image = { image: randoData.rando.player.avatar }

      let fields = []

      if (randomFooterText != "") {
        this.props.footer = {
          text: randomFooterText
        }
      }

      // Construct the content for the channel message
      let roleIDs = {}
      let roleIDsPath = path.join(
        __dirname,
        '..',
        '..',
        'dbs',
        interaction?.guild.id,
        'roleIDs.json'
      )
      if (fs.existsSync(roleIDsPath)) {
        roleIDs = require(roleIDsPath)
      }
      if (roleID == 0) {
        roleID = roleIDs["pingable-multiplayer-role"] ?? 0
      }

      let roleObject = null
      if (roleID != 0) {
        roleObject = await interaction?.guild?.roles.fetch(roleID)
      }
      let pinger = (pingMultiplayerRole && (roleID != 0)) ? `<@&${roleID}>` : ""
      this.content = pinger

      // Announcement
      this.props.description = [
        article(randoTitle).ucfirst() + ` ${randoTitle} game has been generated!`
      ]

      // Permalink
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
          `You can download it from here: ${seedURL}`
        )

        // Get metadata fields
        let hashID = seedURL.split("/")
        hashID = hashID[hashID.length - 1]
        this.props.fields = await getSeedFields(hashID, randomizer)
      } else {
        this.props.fields = []
      }

      this.props.description.push(
        ""  // A blank space, baby
      )

      // Group Name
      this.props.description.push(
        '**Group Name**',
        groupName,
        ""  // A blank space, baby
      )

      // Scripts
      if (randoData?.rando?.scripts && randoData.rando.scripts.length > 0) {
        this.props.description.push(
          `**Scripts**`,
          randoData.rando.scripts,
          ""  // A blank space, baby
        )
      }

      // Start Game Reminder
      this.props.description.push(
        '__**Start Game Reminder**__',
        'Please wait on the Start Game with everyone until the game begins.',
        ""  // A blank space, baby
      )

      // Game Start Time
      this.props.description.push(
        '**Game Start Time**',
        `The game will begin at ${timeFormat(adjustedDateTime.getTime())} which is ${timeFormat(adjustedDateTime.getTime(), { relative: true })}.`
        // No blank space, baby
      )

      // Silent conclusion (no visible follow-up)

    } catch (error) {
      console.error(`Error handling /${this.name} command:`, error)

      this.error = true
      // Respond with an error message if something goes wrong
      this.props.description = `An error occurred while setting up the ${randomizer} game. Please try again later.`
    }

    return !this.error
  }
}
