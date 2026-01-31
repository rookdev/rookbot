// @ts-nocheck

// Guild Member, Formatters: inlineCode, userMention
const { GuildMember, inlineCode, userMention, hyperlink } = require('discord.js')
// Rook-branded Client
const { RookClient } = require('../../classes/objects/rclient.class')
// Rook-branded Embed
const { RookEmbed } = require('../../classes/embed/rembed.class')
const timeConversion = require('../../utils/formatters/timeConversion')
const mentionFuncs = require('../../utils/formatters/mentions')
// Use Discord HammerTime
const timeFormat = require('../../utils/formatters/timeFormat')
const fileFuncs = require('../../utils/fs/fileFuncs')
const dbFuncs = require('../../utils/db/dbFuncs')
const getters = require('../../utils/guild/getters')
const moment = require('moment')
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
    let guildChannels = null

    // DB
    let dbRes = await dbFuncs.getDB(
      guildID,
      "channels"
    )
    guildChannels = dbRes[0]
    let newMessages = dbRes[1]
    messages = messages.concat(newMessages)
    // /DB

    if (!guildChannels) {
      messages.push(`${client.profile.emojis.fail} Failed to fetch Guild Channels for ${mentionFuncs.guildMention(oldMember.guild.name, oldMember.guild.id, { showID: true, oneLine: true, textOnly: true })}`)
      return [result, messages]
    }

    let log_type = "logging"
    let log_check = "logging-members"
    if (log_check in guildChannels) {
      log_type = log_check
    }
    const logChannel = await getters.getCache(client, client, "channels", guildChannels[log_type])

    if (!logChannel) {
      messages.push(`${client.profile.emojis.fail} Log channel not found or is not text-based.`)
      return [result, messages]
    }

    let joinedMoment = null
    const leftMoment = moment.utc()
    let durationStr = ""
    const validJoin = oldMember.joinedAt && oldMember.joinedTimestamp
    const validLeave = leftMoment

    if (validJoin && validLeave) {
      joinedMoment  = moment.utc(oldMember.joinedTimestamp)
      durationStr   = timeConversion(
        moment.duration(
          Math.abs(
            joinedMoment.diff(
              leftMoment
            )
          )
        )
      )
    }


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
            value: validLeave
              ? timeFormat(leftMoment.format("x"), { with: "relative" })
              : 'Unknown' // Handle cases where leftAt is null
          }
        ],
        [
          // Joined DateTime
          {
            name: 'Joined At',
            value: validJoin
              ? (timeFormat(joinedMoment.format("x"), { with: "relative" }))
              : 'Unknown' // Handle cases where joinedAt is null
          }
        ],
        [
          // Duration DateTime
          {
            name: 'Lasted For',
            value: (validJoin && validLeave)
              ? durationStr
              : 'Unknown' // Handle cases where Duration is null
          }
        ],
        [
          // Who Left?
          // Hyperlink in case Mention doesn't load
          {
            name: 'Member Left',
            value: hyperlink(
              oldMember.user.tag,
              `https://discord.com/users/${oldMember.user.id}`
            )
          }
        ],
        [
          // Who Left?
          {
            name: "Member Link",
            value: mentionFuncs.userMention(oldMember.user.id, { showID: true })
          }
        ],
        [
          // Left what Guild?
          {
            name: 'Guild',
            value: mentionFuncs.guildMention(
              oldMember.guild.name,
              oldMember.guild.id,
              {
                showID: true
              }
            )
          }
        ]
      ]
    })

    let console_log = {
      guild: oldMember.guild.name,
      member: oldMember.user.tag,
      action: "leave",
      joinAt: validJoin ? oldMember.joinedAt : null,
      joinStamp: validJoin ? oldMember.joinedTimestamp : null,
      joinMoment: validJoin ? joinedMoment : null,
      leftMoment: validLeave ? leftMoment : null,
      joinMomentStamp: validJoin ? joinedMoment.format("x") : null,
      leftMomentStamp: validLeave ? leftMoment.format("x") : null,
      diffStamp: (validJoin && validLeave) ? joinedMoment.diff(leftMoment) : null,
      durationMoment: (validJoin && validLeave) ? moment.duration(Math.abs(joinedMoment.diff(leftMoment))) : null,
      duration: (validJoin && validLeave) ? durationStr : null
    }
    messages.push("🚪 " + JSON.stringify(console_log))

    // Send the log embed to the log channel
    // @ts-ignore
    result = await logChannel.send({ embeds: [logEmbed] })

    // Save the leaving member to a log file
    const DEV = !process.env.ENV_ACTIVE.startsWith("prod")
    const logFilePath = fileFuncs.getAPath(
      [
        "src",
        "botlogs"
      ],
      `${DEV ? 'DEV' : ''}memberChanges.log`
    )
    const logEntry = [
      `[${moment.utc().toISOString()}]`,
      `User:    ${oldMember.user.tag} (ID: ${oldMember.user.id})`,
      `Guild:   ${oldMember.guild.name} (ID: ${oldMember.guild.id})`,
      `Event:   Member Left`,
      '--------------------------------'
    ].join('\n') + '\n\n'

    // Append the log entry to the file
    fs.appendFileSync(logFilePath, logEntry, 'utf8')
  } catch (error) {
    messages.push(`${client.profile.emojis.fail} Error logging member leave:`, error)
    return [result, messages]
  }

  return [result, messages]
}
