// @ts-nocheck

// Guild Member, Formatters: inlineCode, userMention
const { GuildMember, inlineCode, userMention } = require('discord.js')
// Rook-branded Client
const { RookClient } = require('../../classes/objects/rclient.class')
// Rook-branded Embed
const { RookEmbed } = require('../../classes/embed/rembed.class')
// Use Discord HammerTime
const timeFormat = require('../../utils/formatters/timeFormat')
const fileFuncs = require('../../utils/fs/fileFuncs')
const moment = require('moment')
const fs = require('fs')      // Filesystem manipulation

/**
 * Logs when a new member joins the server and saves it to a log file.
 * @param {RookClient} client
 * @param {GuildMember} newMember
 */
module.exports = async (client, newMember) => {
  let result = false
  let messages = []

  try {
    // Ensure the member's data is fully fetched
    const fetchedMember = await newMember.guild.members.fetch(newMember.user.id) ?? null
    if (!fetchedMember) {
      messages.push(`${client.profile.emojis.fail} Failed to fetch '${newMember.user.tag}' [${newMember.id}] from '${newMember.guild.name}' [${newMember.guild.id}]`)
      return [result, messages]
    }

    // Fetch the log channel using the fetchedMember's guild ID
    const guildID = fetchedMember.guild.id
    const guildChannels = fileFuncs.getAFile(
      [
        "src",
        "dbs",
        guildID
      ],
      "channels.json"
    )
    if (!guildChannels) {
      messages.push(`${client.profile.emojis.fail} Failed to fetch Guild Channels for '${fetchedMember.guild.name}' [${fetchedMember.guild.id}]`)
      return [result, messages]
    }

    let log_type = "logging"
    let log_check = "logging-members"
    if (log_check in guildChannels) {
      log_type = log_check
    }
    const logChannel = await client.channels.fetch(guildChannels[log_type])

    if (!logChannel) {
      messages.push(`${client.profile.emojis.fail} Log channel not found or is not text-based.`)
      return [result, messages]
    }

    let joinedDateTime = moment.utc(fetchedMember.joinedTimestamp)
    let createdDateTime = moment.utc(fetchedMember.user.createdTimestamp)
    let logFields = [
      [
        // Joined DateTime
        {
          name: 'Joined At',
          value: joinedDateTime
            ? timeFormat(joinedDateTime.format("x")) + " (" + timeFormat(joinedDateTime.format("x"), { relative: true }) + ")"
            : 'Unknown' // Handle cases where joinedAt is null
        }
      ],
      [
        // Creation DateTime
        {
          name: 'Created At',
          value: createdDateTime
            ? `${timeFormat(createdDateTime.format("x"), { with: "relative" })}`
            : 'Unknown' // Handle cases where createdAt is null
        }
      ],
      [
        // Who Joined?
        // Hyperlink in case the Mention doesn't load
        {
          name: 'Member Joined',
          value: `[${fetchedMember.user.tag}]` +
            `(https://discord.com/users/${fetchedMember.user.id})` + " " +
            `[${inlineCode(fetchedMember.user.id)}]`
        }
      ],
      [
        // Who Joined?
        {
          name: "Member Link",
          value: userMention(fetchedMember.user.id)
        }
      ],
      [
        // Joined what Guild?
        {
          name: 'Guild',
          value: [
            fetchedMember.guild.name,
            `[${inlineCode(fetchedMember.guild.id)}]`
          ]
        }
      ]
    ]

    if (newMember.roles.cache.find(
      r => r.name === "Member"
    )) {
      logFields.push(
        [
          {
            name: "Member Role?",
            value: client.profile.emojis.check
          }
        ]
      )
    }

    let console_log = {
      guild: fetchedMember.guild.name,
      member: fetchedMember.user.tag,
      action: "join"
    }
    messages.push("👋 " + JSON.stringify(console_log))

    // Prepare the log embed
    const logEmbed = new RookEmbed(client, {
      color: client.profile.colors.good,
      title: {
        text: '[Log] Member Joined',
        emoji: "👋"
      },
      players: {
        user: {
          name: fetchedMember.guild.name,
          avatar: fetchedMember.guild.iconURL( { size: Math.pow(2, 7) } )
        },
        target: {
          name: newMember.user.displayName,
          avatar: newMember.user.displayAvatarURL( { size: Math.pow(2, 7) } )
        }
      },
      fields: logFields
    })

    // Send the log embed to the log channel
    // @ts-ignore
    result = await logChannel.send({ embeds: [logEmbed] })

    // Save the joining member to a log file
    const DEV = !process.env.ENV_ACTIVE.startsWith("prod")
    const logFilePath = fileFuncs.getAPath(
      [
        "src",
        "botlogs"
      ],
      `${this.DEV ? 'DEV' : ''}memberChanges.log`
    )
    const logEntry = [
      `[${moment.utc().toISOString()}]`,
      `User:    ${fetchedMember.user.tag} (ID: ${fetchedMember.user.id})`,
      `Guild:   ${fetchedMember.guild.name} (ID: ${fetchedMember.guild.id})`,
      `Event:   Member Joined`,
      '--------------------------------'
    ].join('\n') + '\n\n'

    // Append the log entry to the file
    fs.appendFileSync(logFilePath, logEntry, 'utf8')
  } catch (error) {
    messages.push(`${client.profile.emojis.fail} Error logging new member:`, error)
    return [result, messages]
  }

  return [result, messages]
}
