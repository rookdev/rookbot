// @ts-nocheck
// Command Option Types, Permission Flags
const { PermissionFlagsBits, ApplicationCommandOptionType } = require('discord.js')
// Change User Nickname
const { changeNickname } = require('../../utils/changeNickname')
// Base Rook Command
const { RookCommand } = require('../../classes/command/rcommand.class')

module.exports = class NickChangeCommand extends RookCommand {
  constructor(client, comprops, props) {
    comprops = comprops || {
      name: "nickchange",
      category: "doi",
      description: "Immediately triggers a nickname change for specified user",
      options: [
        {
          name: "target-id",
          description: "Target User ID",
          type: ApplicationCommandOptionType.String,
          required: true
        }
      ],
      testOptions: [
        { "target-id": "1017468471669440692" }, // lostflake
        { "target-id": "1111517386588307536" }, // castIe
        { "target-id": "263968998645956608" }   // Minnie
      ],
      userPermissions: [ PermissionFlagsBits.ManageNicknames ],
      botPermissions: [ PermissionFlagsBits.ManageNicknames ]
    }
    props = props || {}
    super(
      client,
      {...comprops},
      {...props}
    )
  }

  // declare props: import('../../types/embed').EmbedProps

  async action(client, interaction, coptions={}) {
    // Get Guild ID
    const guildID = interaction.guild.id
    // Get User Input
    const targetUserInput = coptions["target-id"] || "1111517386588307536"
    // Extract user ID from mention (if it's a mention)
    const targetUserId = targetUserInput.replace(/[<@!>]/g, '')  // Remove <@>, <@!>, and >

    try {
      // Get this guild
      const guild = await client.guilds.fetch(guildID)
      if (!guild) {
        // Bail if no Guild
        this.error = true
        this.props.description = `Guild not found [${guildID}]`
        return false
      }

      // Find User
      let member = null
      try {
        member = await guild.members.fetch(targetUserId)
      } catch (error) {
        // do nothing
      }

      // Set EmbedPlayerTypes to Caller|Target
      this.props.playerTypes = {
        user: "caller",
        target: "target"
      }

      this.props.entities = {
        caller: {
          name: interaction.user.displayName,
          avatar: interaction.user.displayAvatarURL({ size: 128 })
        }
      }

      // Couldn't find User
      if (!member || !member.user) {
        this.error = true
        this.props.description = "Member not found or invalid data"
        // Set EmbedPlayerTypes to Bot|Guild
        this.props.playerTypes = {
          user: "bot",
          target: "guild"
        }
        return false
      }

      // Set Target to command target
      this.props.entities.target = {
        name: member.user.displayName,
        avatar: member.displayAvatarURL({ size: 128 })
      }

      // Call the utility function to change the nickname
      const result = await changeNickname(client, member)

      if (result?.success) {
        this.props.title = { text: "Nickname Changed" }
        this.props.description = result.message
        // console.log(result.message)
      } else {
        this.error = true
        this.props.title = { text: "Nickname Not Changed" }
        this.props.description = result?.message
        return false
      }
    } catch (error) {
      this.error = true
      this.props.description = "There was an error changing the nickname"
      console.error("Error changing nickname:", error)
      return false
    }

    return !this.error
  }
}
