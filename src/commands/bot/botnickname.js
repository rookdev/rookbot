// @ts-nocheck

const { ApplicationCommandOptionType } = require('discord.js')
const { BotDevCommand } = require('../../classes/command/botdevcommand.class')

module.exports = class BotNicknameCommand extends BotDevCommand {
  constructor(client) {
    let comprops = {
      name: "botnickname",
      category: "bot",
      description: "Set rookbot's Nickname",
      flags: {
        user: "unapplicable"
      },
      options: [
        {
          name: "bot-nickname",
          description: "Bot Nickname",
          type: ApplicationCommandOptionType.String,
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
    let new_nickname = coptions["bot-nickname"]
    let old_nickname = ""

    this.props.title = {
      text: `Set ${client.user.displayName}'s Nickname`
    }

    if (["default","reset"].includes(new_nickname)) {
      new_nickname = client.user.displayName
    }

    try {
      let guildID = interaction.guild.id
      let guild = await client.guilds.fetch(guildID)
      if (!guild) {
        this.error = true
        this.props.description = `Guild not found [${guildID}]`
        return !this.error
      }

      this.props.title.text = `${this.props.title.text} in ${guild.name}`

      let member = await guild.members.fetch(client.user.id).catch(err => {
        this.error = true
        this.props.description = `Fetch error [${client.user.id}]: ${err}`
        return !this.error
      })

      if(!member || !member.user) {
        this.error = true
        this.props.description = "Member not found or invalid data"
        return !this.error
      }

      old_nickname = member.displayName

      if (old_nickname != new_nickname) {
        member.setNickname(new_nickname)
      }

      this.props.fields = [
        [
          {
            name: "Old Nickname",
            value: old_nickname
          },
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
