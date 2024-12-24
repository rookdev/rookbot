// @ts-nocheck

const { GuildMember } = require('discord.js')
const { RookClient } = require('../../classes/objects/rclient.class')
const { RookEmbed } = require('../../classes/embed/rembed.class')
const colors = require('../../dbs/colors.json')
const path = require('path')
const fs = require('fs')

/**
 * Logs changes to a user's nickname in the server.
 * @param {RookClient} client
 * @param {GuildMember} oldMember
 * @param {GuildMember} newMember
 */
module.exports = async (client, oldMember, newMember) => {
  try {
    // Check if the nickname has changed
    if (oldMember.nickname === newMember.nickname) {
      console.warn('No nickname change detected.')
      return
    }

    // Ensure the member is in a guild
    if (!newMember.guild) {
      console.warn('GuildMemberUpdate occurred outside of a guild:', newMember)
      return
    }

    // Prepare the log embed
    let oldNick = oldMember.nickname ?? "No nickname"
    let newNick = newMember.nickname ?? newMember.user.displayName
    const embed = new RookEmbed(client, {
      color: colors["info"], // Gold color for nickname changes
      title: {
        text: '[Log] Nickname Changed',
        emoji: "✏️"
      },
      players: {
        user: {
          name: newMember.user.displayName,
          avatar: newMember.user.displayAvatarURL( { size: 128 } )
        },
        target: {
          name: newMember.user.displayName,
          avatar: newMember.user.displayAvatarURL( { size: 128 } )
        }
      },
      fields: [
        [
          {
            name: 'User',
            value: `<@${newMember.user.id}>` + " " +
              `(ID: \`${newMember.user.id}\`)`
          }
        ],
        [
          {
            name: 'Guild',
            value: newMember.guild.name + " " +
              `(ID: \`${newMember.guild.id}\`)`
          }
        ],
        [
          {
            name: 'Old Nickname',
            value: oldNick
          }
        ],
        [
          {
            name: 'New Nickname',
            value: newNick // Use username if nickname is undefined
          }
        ]
      ]
    });

    // Fetch the log channel using its ID
    const guildID = newMember.guild.id
    const guildChannels = require(`../../dbs/${guildID}/channels.json`)
    let log_type = "logging"
    let log_check = "logging-names"
    if (log_check in guildChannels) {
      log_type = log_check
    }
    const logChannel = client.channels.cache.get(guildChannels[log_type])

    // Send the embed to the log channel, if found and valid
    if (logChannel?.isTextBased()) {
      // @ts-ignore
      await logChannel.send({ embeds: [ embed.toJSON() ] })
    } else {
      console.warn('Log channel not found or not a text-based channel.')
    }

    // Optional: Save the nickname change to a log file
    const DEV = process.env.ENV_ACTIVE === "development"
    const logFilePath = path.join(
      __dirname,
      '..',
      '..',
      'botlogs',
      `${DEV ? 'DEV' : ''}nicknameChanges.log`
    )
    const logEntry = [
      `[${new Date().toISOString()}]`,
      `User:         ${newMember.user.tag} (ID: ${newMember.user.id})`,
      `Guild:        ${newMember.guild.name} (ID: ${newMember.guild.id})`,
      `Old Nickname: ${oldNick}`,
      `New Nickname: ${newNick}`, // Use username if nickname is undefined
      '--------------------------------'
    ].join('\n') + '\n\n'

    // Append the log entry to the file
    fs.appendFileSync(logFilePath, logEntry, 'utf8')
  } catch (error) {
    console.error('Error in logNameChange handler:', error)
  }
}
