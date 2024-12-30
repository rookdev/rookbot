// @ts-nocheck

const { GuildMember } = require('discord.js')
const { RookClient } = require('../../classes/objects/rclient.class.js')
const { RookEmbed } = require('../../classes/embed/rembed.class')
const timeFormat = require('../../utils/timeFormat.js')
const colors = require('../../dbs/colors.json')
const path = require('path')
const fs = require('fs')

/**
 * Logs when a new member joins the server and saves it to a log file.
 * @param {RookClient} client
 * @param {GuildMember} newMember
 */
module.exports = async (client, newMember) => {
  try {
    // Ensure the member's data is fully fetched
    const fetchedMember = await newMember.guild.members.fetch(newMember.user.id)

    // Fetch the log channel using the fetchedMember's guild ID
    const guildID = fetchedMember.guild.id
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
            `(ID: \`${fetchedMember.user.id}\`)`
        }
      ],
      [
        // Who Joined?
        {
          name: "Member Link",
          value: `<@${fetchedMember.user.id}>`
        }
      ],
      [
        // Joined what Guild?
        {
          name: 'Guild',
          value: [
            fetchedMember.guild.name,
            `(ID: \`${fetchedMember.guild.id}\`)`
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
            value: "Yes"
          }
        ]
      )
    }

    let console_log = {
      guild: fetchedMember.guild.name,
      member: fetchedMember.user.tag
    }
    console.log("   " + JSON.stringify(console_log))

    // Prepare the log embed
    const logEmbed = new RookEmbed(client, {
      color: colors["good"], // Green for new members joining
      title: {
        text: '[Log] Member Joined',
        emoji: "👋"
      },
      players: {
        user: {
          name: fetchedMember.guild.name,
          avatar: fetchedMember.guild.iconURL( { size: 128 } )
        },
        target: {
          name: newMember.user.displayName,
          avatar: newMember.user.displayAvatarURL( { size: 128 } )
        }
      },
      fields: logFields
    })

    // Send the log embed to the log channel
    // @ts-ignore
    await logChannel.send({ embeds: [logEmbed] })

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
    console.error('Error logging new member:', error)
  }
}
