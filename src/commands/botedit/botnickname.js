// @ts-nocheck

// Command Option Types
const { ApplicationCommandOptionType } = require('discord.js')
// BotDevCommand
const { BotDevCommand } = require('../../classes/command/botdevcommand.class')

module.exports = class BotNicknameCommand extends BotDevCommand {
  constructor(client) {
    let comprops = {
      name: "botnickname",
      category: "botedit",
      description: "Set rookbot's Nickname",
      flags: {
        user: "unapplicable"
      },
      options: [
        {
          name: "bot-nickname",
          description: "Bot Nickname",
          type: ApplicationCommandOptionType.String,
          maxLength: 32,
          required: true
        }
      ]
    }
    let props = {}

    super(
      client,
      {...comprops},
      {...props}
    )
  }

  // declare props: import('../../types/embed').EmbedProps

  async action(client, interaction, coptions) {
    this.props.playerTypes = {
      user: "caller",
      target: "bot"
    }

    // Get New Nickname
    let new_nickname = coptions["bot-nickname"]
    // Bucket for Old Nickname
    let old_nickname = ""

    this.props.title = {
      text: `Set ${client.user.displayName}'s Nickname`
    }

    // Default or Reset goes back to Global Name
    if (["default","reset"].includes(new_nickname)) {
      new_nickname = client.user.displayName
    }

    // Bail if over 32 characters
    //  Technically, new SlashCommand interface validates this
    if (new_nickname.length > 32) {
      this.error = true
      this.props.description = `Nickname '${new_nickname}' is too long, maximum is 32 characters.`
      return false
    }

    try {
      // Get Guild ID
      let guildID = interaction.guild.id
      // Get Guild
      let guild = await client.guilds.fetch(guildID)
      if (!guild) {
        // Bail if Guild not found
        this.error = true
        this.props.description = `Guild not found [${guildID}]`
        return !this.error
      }

      this.props.title.text = `${this.props.title.text} in ${guild.name}`

      // Get Client Member
      // Bail if Client Member not found
      let member = await guild.members.fetch(client.user.id).catch(err => {
        this.error = true
        this.props.description = `Fetch error [${client.user.id}]: ${err}`
        return !this.error
      })

      // Bail if Client Member not found
      if(!member || !member.user) {
        this.error = true
        this.props.description = "Member not found or invalid data"
        return !this.error
      }

      // Get Old Nickname
      old_nickname = member.displayName

      // If it's different, set it
      if (old_nickname != new_nickname) {
        member.setNickname(new_nickname)
      }

      this.props.fields = [
        [
          // Old Nickname
          {
            name: "Old Nickname",
            value: old_nickname
          },
          // New Nickname
          {
            name: "New Nickname",
            value: new_nickname
          }
        ]
      ]
    } catch(e) {
      this.error = true
      this.props.description = [
        `Error when setting nickname for ${client.user}: '${new_nickname}'`,
        e.stack
      ]
    }

    return !this.error
  }
}
