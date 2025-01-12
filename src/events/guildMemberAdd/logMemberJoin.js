// @ts-nocheck

// Guild Member, Formatters: inlineCode, userMention
const { GuildMember, inlineCode, userMention } = require('discord.js')
// Rook-branded Client
const { RookClient } = require('../../classes/objects/rclient.class')
// Rook-branded Embed
const { RookEmbed } = require('../../classes/embed/rembed.class')
// Use Discord HammerTime
const timeFormat = require('../../utils/timeFormat')
const path = require('path')  // Easier filepath management
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
      messages.push(`Failed to fetch '${newMember.user.username}' [${newMember.id}] from '${newMember.guild.name}' [${newMember.guild.id}]`)
      return [result, messages]
    }

    // Fetch the log channel using the fetchedMember's guild ID
    const guildID = fetchedMember.guild.id
    const guildChannelsPath = path.join(
      __dirname,
      "..",
      "..",
      "dbs",
      guildID,
      "channels"
    )
    if (!fs.existsSync(guildChannelsPath + ".json")) {
      messages.push(`Failed to fetch Guild Channels for '${fetchedMember.guild.name}' [${fetchedMember.guild.id}]`)
      return [result, messages]
    }

    const guildChannels = require(guildChannelsPath)
    let log_type = "logging"
    let log_check = "logging-members"
    if (log_check in guildChannels) {
      log_type = log_check
    }
    const logChannel = await client.channels.fetch(guildChannels[log_type])

    if (!logChannel) {
      messages.push('Log channel not found or is not text-based.')
      return [result, messages]
    }

    let joinedDateTime = new Date(fetchedMember.joinedTimestamp)
    let logFields = [
      [
        // Joined DateTime
        {
          name: 'Joined At',
          value: joinedDateTime
            ? timeFormat(joinedDateTime.getTime())
            : 'Unknown' // Handle cases where joinedAt is null
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
    messages.push(JSON.stringify(console_log))

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
    const logFilePath = path.join(
      __dirname,
      '..',
      '..',
      'botlogs',
      `${DEV ? 'DEV' : ''}memberChanges.log`
    )
    const logEntry = [
      `[${new Date().toISOString()}]`,
      `User:    ${fetchedMember.user.tag} (ID: ${fetchedMember.user.id})`,
      `Guild:   ${fetchedMember.guild.name} (ID: ${fetchedMember.guild.id})`,
      `Event:   Member Joined`,
      '--------------------------------'
    ].join('\n') + '\n\n'

    // Append the log entry to the file
    fs.appendFileSync(logFilePath, logEntry, 'utf8')
  } catch (error) {
    messages.push('Error logging new member:', error)
    return [result, messages]
  }

  return [result, messages]
}
