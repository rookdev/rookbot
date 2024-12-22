const { ApplicationCommandOptionType, PermissionFlagsBits } = require('discord.js')
const { ModCommand } = require('../../classes/command/modcommand.class')
const { RookEmbed } = require('../../classes/embed/rembed.class')
const colors = require('../../dbs/colors.json')

module.exports = class TimeoutCommand extends ModCommand {
  constructor(client) {
    let comprops = {
      name: "timeout",
      category: "mod",
      description: "Times out a user for a specified duration.",
      flags: {
        bot: "optional",
        user: "invalid",
        target: "required"
      },
      options: [
        {
          name: "target-id",
          description: "The ID of the user you want to timeout.",
          type: ApplicationCommandOptionType.String,
          required: true
        },
        {
          name: "duration-seconds",
          description: "The duration of the timeout (in seconds).",
          type: ApplicationCommandOptionType.Integer,
          required: true
        },
        {
          name: "reason",
          description: "The reason for the timeout.",
          type: ApplicationCommandOptionType.String,
          required: false
        }
      ],
      permissions: [ PermissionFlagsBits.ModerateMembers ]
    }
    let props = {}

    super(
      client,
      {...comprops},
      {...props}
    )
  }
  /**
   *
   * @param {RookClient} client
   * @param {Interaction} interaction
   */
  async action(client, interaction, options) {
    const guildID = interaction.guild.id
    const guildChannels = require(`../../dbs/${guildID}/channels.json`)
    const targetUserInput = options["target-id"]
    const timeoutDurationSeconds = Math.abs(options["duration-seconds"]) // Duration in seconds
    const reason = options["reason"] || 'No reason provided'

    // Extract user ID from mention (if it's a mention)
    const targetUserId = targetUserInput.replace(/[<@!>]/g, '')  // Remove <@>, <@!>, and >

    // Get the user to be timed out
    let targetUser
    try {
      targetUser = await client.users.fetch(targetUserId)
    } catch (error) {
      this.error = true
      this.props.description = "User not found."
      return
    }

    // Get the guild member (to fetch nickname if present)
    const guildMember = interaction.guild.members.cache.get(targetUserId)

    try {
      // Convert the timeout duration from seconds to milliseconds
      const timeoutDurationMilliseconds = timeoutDurationSeconds * 1000

      if (guildMember && !this.DEV) {
        // Set the timeout (mute and prevent interactions)
        await guildMember.timeout(timeoutDurationMilliseconds, reason)
      }

      // Determine the name to display (use nickname if available, otherwise default to tag or username)
      const targetUserName = guildMember?.nickname || targetUser.username

      // Reply publicly in the channel to confirm the timeout
      let plural = "second" + (timeoutDurationSeconds != 1 ? "s" : "")

      this.props = {
        color: colors["success"],
        title: { text: "[ModPost] Success!", emoji: "🟢" },
        description: (this.DEV ? "DEV: " : "") + `User **${targetUserName}** has been **timed out** for ${timeoutDurationSeconds} ${plural}. (ID: \`${targetUserId}\`; ${reason})`
      }

      if (!this.DEV) {
        // Log the action in the logs channel (private)
        const logs = client.channels.cache.get(guildChannels["logging"])
        if (logs) {
          let props = {
            color: colors["info"],
            title: {
              text: "[Log] User Timeout",
              emoji: "⏰"
            },
            fields: [
              [
                { name: 'User',             value: `${targetUser}\n(ID: ${targetUserId})` },
                { name: 'Timeout By',       value: `${interaction.user}\n(ID: ${interaction.user.id})` }
              ],
              [
                { name: 'Reason',           value: reason }
              ]
              [
                { name: 'Timeout Duration', value: `${timeoutDuration} ${plural}` }
              ]
            ]
          }
          const embed = new RookEmbed(client, props)

          logs.send({ embeds: [ embed ] })
        } else {
          console.log("Logs channel not found.")
        }
      }

      // Delete the deferred private reply to avoid it being left pending

    } catch (error) {
      console.log(`There was an error when timing out the user: ${error.stack}`)
      this.error = true
      this.ephemeral = true
      this.props.description = `I couldn't timeout that user (ID: ${targetUserId}).`
    }
  }
}
