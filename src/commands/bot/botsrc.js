// @ts-nocheck

// Formatters: hyperlink
const { hyperlink } = require('discord.js')
// Base Rook Command
const { RookCommand } = require('../../classes/command/rcommand.class')

module.exports = class BotSourceCommand extends RookCommand {
  constructor(client) {
    // Git Repository info
    // FIXME: Extrapolate
    let git_info = {
      user: "mysterypaintwo",
      repo: "rookbot"
    }
    git_info.root = `https://github.com/${git_info.user}/${git_info.repo}`

    let comprops = {
      name: "botsrc",
      category: "bot",
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
