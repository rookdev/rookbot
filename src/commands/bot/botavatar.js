// @ts-nocheck

const { ApplicationCommandOptionType } = require('discord.js')
const { BotDevCommand } = require('../../classes/command/botdevcommand.class')

module.exports = class BotAvatarCommand extends BotDevCommand {
  constructor(client) {
    let comprops = {
      name: "botavatar",
      category: "bot",
      description: "Set rookbot's Avatar",
      flags: {
        user: "unapplicable"
      },
      options: [
        {
          name: "avatar-url",
          description: "Avatar URL",
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
    let new_avatar = coptions["avatar-url"]
    let old_avatar = client.user.displayAvatarURL()

    this.props.title = {
      text: `Setting ${client.user.displayName}'s Avatar`
    }

    try {
      if (["default","reset"].includes(new_avatar)) {
        new_avatar = "https://github.com/mysterypaintwo/rookbot/blob/main/src/res/media/rookbotIcon.png?raw=true"
      }

      client.user.setAvatar(new_avatar)
      this.players.target = {
        avatar: old_avatar
      }
      this.props.image = { image: new_avatar }
    } catch(e) {
      this.error = true
      this.props.description = [
        `Error when setting avatar for ${client.user}: '${new_avatar}'`,
        e.stack
      ]
    }

    return !this.error
  }
}
