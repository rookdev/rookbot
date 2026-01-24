// @ts-nocheck
// Command Option Types, Permission Flags, Formatters: inlineCode, italic
const { ApplicationCommandOptionType, PermissionFlagsBits, inlineCode, italic  } = require('discord.js')
// Change User Nickname
const { changeNickname } = require('../../utils/guild/changeNickname')
// Base Rook Command
const { RookCommand } = require('../../classes/command/rcommand.class')

module.exports = class NickChangeCommand extends RookCommand {
  constructor(client, comprops, props) {
    comprops = comprops || {
      name: "nickchange",
      category: "botdo",
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
        { "target-id": "1307416505171968011" }, // rookbot (Minnie)
        { "target-id": "263968998645956608" },  // Minnie
        { "target-id": "1111517386588307536" }, // castIe
        { "target-id": "283321345612185611" },  // Murder
        { "target-id": "1017468471669440692" }, // lostflake
        { "target-id": "942642507488034841" },  // TridentBot
        { "target-id": "211926100681424906" },  // Nikose
        { "target-id": "375068222057086976" }   // DoI Dev
      ],
      aliases: [
        {
          name: "castiename",
          description: "Immediately triggers a nickname change for castIe to a random castIe-esque name.",
          options: { "target-id": "1111517386588307536" }
        },
        {
          name: "castlename",
          description: "Immediately triggers a nickname change for castIe to a random castIe-esque name.",
          options: { "target-id": "1111517386588307536" }
        }
      ],
      userPermissions: [ PermissionFlagsBits.ViewChannel ],
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
    const targetUserInput = coptions["target-id"] ?? "0"
    // Extract user ID from mention (if it's a mention)
    const targetUserId = targetUserInput.replace(/[<@!>]/g, '')  // Remove <@>, <@!>, and >

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

    // Get this guild
    const guild = await this.getCache(client, client, "guilds", guildID)
    if (!guild) {
      // Bail if no Guild
      this.error = true
      this.props.playerTypes = {
        user: "bot",
        target: "bot"
      }
      this.props.description = `Guild not found [${guildID}]`
      return false
    }

    // Find User
    let member = null

    // Try getting from cache
    if (!member) {
      member = await this.getCache(client, interaction.guild, "members", targetUserId)
    }

    // Try force-fetching
    if (!member) {
      try {
        member = await guild.members.fetch(
          {
            user: [ targetUserId ],
            force: true
          }
        ).first()
      } catch (error) {
        // do nothing
      }
    }

    if (!member) {
      // Bail if no Member
      this.error = true
      this.props.playerTypes = {
        user: "bot",
        target: "guild"
      }
      this.props.description = `Member not found [${inlineCode(targetUserId)}] in ${italic(guild.name)}.`
      return false
    }

    // Set Target to command target
    this.props.entities.target = {
      name: member?.displayName,
      avatar: member.displayAvatarURL({ size: 128 })
    }

    // Check Editable
    let editable = await this.botCanEdit(client, member, false)
    if (!editable) {
      return false
    }

    // Call the utility function to change the nickname
    const result = await changeNickname(client, member)

    if (result?.success) {
      this.props.title = { text: "Nickname Changed" }
      this.props.description = result.message
      // console.log(result.message)
    } else {
      this.error = true
      this.props.description = result?.message
      return false
    }

    return !this.error
  }
}
