// @ts-nocheck

// Base Rook Command
const { RookCommand } = require('../../classes/command/rcommand.class')
const { RookMessage } = require('../../classes/objects/rmessage.class')

module.exports = class TestCommand extends RookCommand {
  constructor(client) {
    let comprops = {
      name: "test",
      category: "diagnostic",
      flags: {
        test: "basic"
      }
    }
    super(
      client,
      {...comprops}
    )
  }

  // declare props: import('../../types/embed').EmbedProps

  async execute(client, interaction, coptions, independent=false) {
    this.messages.push(`/${this.name}: Command Execute`)
    let page = {
      title: { text: "Title" },
      color: "#ffaf00",
      content: "Content",
      description: "Description",
      fields: [
        [
          { name: "Name", value: "Value" }
        ]
      ]
    }
    let pages = [ page ]

    console.log(this.messages.map(m=>"   " + m).join("\n"))

    let rmessage = await new RookMessage(
      client,
      interaction,
      {
        // channelName: "bot-console",
        pages: page
      }
    )
    let exec_result = await rmessage.execute()
  }
}
