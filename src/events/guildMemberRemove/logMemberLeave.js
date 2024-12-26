// @ts-nocheck

const { GuildMember } = require('discord.js')
const { RookClient } = require('../../classes/objects/rclient.class.js')
const { RookEmbed } = require('../../classes/embed/rembed.class')
const timeFormat = require('../../utils/timeFormat.js')
const colors = require('../../dbs/colors.json')
const path = require('path')
const fs = require('fs')

/**
 * Logs when a member leaves the server and saves it to a log file.
 * @param {RookClient} client
 * @param {GuildMember} oldMember
 */
module.exports = async (client, oldMember) => {
  try {
    // Fetch the log channel using the oldMember's guild ID
    const guildID = oldMember.guild.id
    const guildChannels = require(`../../dbs/${guildID}/channels.json`)
    let log_type = "logging"
    let log_check = "logging-members"
    if (log_check in guildChannels) {
      log_type = log_check
    }
    const logChannel = await client.channels.fetch(guildChannels[log_type])

    if (!logChannel) {
      console.warn('Log channel not found or is not text-based.')
      return
    }

    const leftDateTime = new Date()

    // Prepare the log embed
    const logEmbed = new RookEmbed(client, {
      color: colors["bad"], // Red for member leaving
      title: {
        text: '[Log] Member Left',
        emoji: "🚶‍♂️🚪"
      },
      players: {
        user: {
          name: oldMember.guild.name,
          avatar: oldMember.guild.iconURL( { size: 128 } )
        },
        target: {
          name: oldMember.user.displayName,
          avatar: oldMember.user.displayAvatarURL( { size: 128 } )
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
              `(ID: \`${oldMember.user.id}\`)`
          }
        ],
        [
          // Who Left?
          {
            name: "Member Link",
            value: `<@${oldMember.user.id}>`
          }
        ],
        [
          // Left what Guild?
          {
            name: 'Guild',
            value: [
              oldMember.guild.name,
              `(ID: \`${oldMember.guild.id}\`)`
            ]
          }
        ]
      ]
    })

    // Send the log embed to the log channel
    // @ts-ignore
    await logChannel.send({ embeds: [logEmbed] });

    // Save the leaving member to a log file
    const DEV = process.env.ENV_ACTIVE === "development"
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
    console.error('Error logging member leave:', error)
  }
}
