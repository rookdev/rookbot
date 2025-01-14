// @ts-nocheck

// Command Option Types
const { ApplicationCommandOptionType } = require('discord.js')
// BotDevCommand
const { BotDevCommand } = require('../../classes/command/botdevcommand.class')
const fileFuncs = require('../../utils/fs/fileFuncs')

module.exports = class BotAvatarCommand extends BotDevCommand {
  constructor(client) {
    let comprops = {
      name: "botavatar",
      category: "botedit",
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
    // Set EmbedPlayerTypes to Caller|Bot
    this.props.playerTypes = {
      user: "caller",
      target: "bot"
    }

    // Get New Avatar URL
    let new_avatar = coptions["avatar-url"]
    // Get Current Avatar URL
    let old_avatar = client.user.displayAvatarURL()

    this.props.title = {
      text: `Setting ${client.user.displayName}'s Avatar`
    }

    try {
      let ci_data = fileFuncs.getAFile(
        [
          "resources",
          "app",
          "meta",
          "manifests"
        ],
        "ci.json"
      )
      if (!ci_data) {
        this.error = true
        this.props.description = `CI Data not found!`
        return false
      }
      let git_info = ci_data.common.common.repo
      git_info.root = `https://github.com/${git_info.username}/${git_info.repository}`

      // Default or Reset sets it back to White rookbot
      if (["default","reset"].includes(new_avatar)) {
        new_avatar = `${git_info.root}/blob/main/src/res/media/rookbotIcon.png?raw=true`
      }

      // Set the new Avatar
      client.user.setAvatar(new_avatar)

      if (!this.props?.entities) {
        this.props.entities = {}
      }
      if (!this.props?.entities?.bot) {
        this.props.entities.bot = {}
      }
      this.props.entities.bot.avatar = old_avatar
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
