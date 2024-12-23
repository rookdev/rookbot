const { RookCommand } = require('../../classes/command/rcommand.class.js')

module.exports = class BotSourceCommand extends RookCommand {
  constructor(client) {
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
        url: "https://github.com/mysterypaintwo/rookbot"
      },
      description: "Want to see how rookbot works? Check out its [source code](https://github.com/mysterypaintwo/rookbot) on GitHub!",
      fields: [
        {
          name: 'rookbot on GitHub',
          value: 'Explore the [source code](https://github.com/mysterypaintwo/rookbot), contribute, or learn more about how rookbot operates. Feel free to fork, report issues, or submit pull requests!'
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

  /**
   * Sends an embed message with a link to the bot\'s GitHub repository.
   */
  async action(client, interaction, coptions={}) {
    // all done in constructor
    return !this.error
  }
}
