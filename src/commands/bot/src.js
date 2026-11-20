// @ts-nocheck

// Formatters: hyperlink
const { hyperlink } = require('discord.js')
// Base Rook Command
const { RookCommand } = require('../../classes/command/rcommand.class')
const fileFuncs = require('../../utils/fs/fileFuncs')

module.exports = class BotSourceCommand extends RookCommand {
  constructor(client) {
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

    let comprops = {
      name: "botsrc",
      category: "botmeta",
      description: "Links to the GitHub repository of rookbot",
      flags: {
        test: "basic"
      }
    }
    let props = {
      title: {
        text: "rookbot GitHub Repository",
        url: git_info.root
      },
      description: `Want to see how rookbot works? Check out its ${hyperlink('source code', git_info.root)} on GitHub!`,
      fields: [
        {
          name: 'rookbot on GitHub',
          value: `Explore the ${hyperlink('source code', git_info.root)}, contribute, or learn more about how rookbot operates. Feel free to fork, report issues, or submit pull requests!`
        }
      ],
      image: { image: "https://github.com/fluidicon.png" }
    }
    super(
      client,
      {...comprops},
      {...props}
    )
  }

  async action(client, interaction, coptions={}) {
    // all done in constructor
    // Set EmbedPlayerTypes to Bot|Bot
    this.props.playerTypes = {
      user: "bot",
      target: "bot"
    }
    return !this.error
  }
}
