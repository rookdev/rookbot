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
 * Logs when a member leaves the server and saves it to a log file.
 * @param {RookClient} client
 * @param {GuildMember} oldMember
 */
module.exports = async (client, oldMember) => {
  let result = false
  let messages = []

  try {
    // Fetch the log channel using the oldMember's guild ID
    const guildID = oldMember.guild.id
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

    const leftDateTime = new Date()

    // Prepare the log embed
    const logEmbed = new RookEmbed(client, {
      color: client.profile.colors.bad,
      title: {
        text: '[Log] Member Left',
        emoji: "🚶‍♂️🚪"
      },
      players: {
        user: {
          name: oldMember.guild.name,
          avatar: oldMember.guild.iconURL( { size: Math.pow(2, 7) } )
        },
        target: {
          name: oldMember.user.displayName,
          avatar: oldMember.user.displayAvatarURL( { size: Math.pow(2, 7) } )
        }
      },
      fields: [
        [
          // Left DateTime
          {
            name: 'Left At',
            value: leftDateTime
              ? timeFormat(leftDateTime.getTime())
              : 'Unknown' // Handle cases where leftAt is null
          }
        ],
        [
          // Who Left?
          // Hyperlink in case Mention doesn't load
          {
            name: 'Member Left',
            value: `[${oldMember.user.tag}]` +
              `(https://discord.com/users/${oldMember.user.id})` + " " +
              `[${inlineCode(oldMember.user.id)}]`
          }
        ],
        [
          // Who Left?
          {
            name: "Member Link",
            value: userMention(oldMember.user.id)
          }
        ],
        [
          // Left what Guild?
          {
            name: 'Guild',
            value: [
              oldMember.guild.name,
              `[${inlineCode(oldMember.guild.id)}]`
            ]
          }
        ]
      ]
    })

    let console_log = {
      guild: oldMember.guild.name,
      member: oldMember.user.tag,
      action: "leave"
    }
    messages.push(JSON.stringify(console_log))

    // Send the log embed to the log channel
    // @ts-ignore
    result = await logChannel.send({ embeds: [logEmbed] })

    // Save the leaving member to a log file
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
      `User:    ${oldMember.user.tag} (ID: ${oldMember.user.id})`,
      `Guild:   ${oldMember.guild.name} (ID: ${oldMember.guild.id})`,
      `Event:   Member Left`,
      '--------------------------------'
    ].join('\n') + '\n\n'

    // Append the log entry to the file
    fs.appendFileSync(logFilePath, logEntry, 'utf8')
  } catch (error) {
    messages.push('Error logging member leave:', error)
    return [result, messages]
  }

  return [result, messages]
}
