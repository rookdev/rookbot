// @ts-nocheck

// Command Option Types
/**
 * Discord Stuff
 *  Command Option Types
 *  Formatters
 *   codeBlock
 */
const { ApplicationCommandOptionType, codeBlock, hyperlink, hideLinkEmbed } = require('discord.js')
// Base Rook Command
const { RookCommand } = require('../../classes/command/rcommand.class')

module.exports = class HyperlinkCommand extends RookCommand {
  constructor(client) {
    let comprops = {
      name: "hyperlink",
      category: "misc",
      description: "Helps create markdown hyperlink",
      options: [
        {
          name: "link-url",
          description: "URL for Hyperlink",
          type: ApplicationCommandOptionType.String,
          required: true
        },
        {
          name: "link-text",
          description: "Text for Hyperlink",
          type: ApplicationCommandOptionType.String,
          required: true
        },
        {
          name: "hide-embed",
          description: "Suppress Embed Preview",
          type: ApplicationCommandOptionType.Boolean
        }
      ],
      testOptions: [
        { "link-url": "http://google.com", "link-text": "Google" },
        { "link-url": "http://google.com", "link-text": "Google", "hide-embed": true }
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
    let hide_embed = coptions["hide-embed"] ?? false
    let href = coptions["link-url"] ?? null
    let text = coptions["link-text"] ?? null

    href = URL.parse(href)

    if (!href) {
      this.error = true
      this.props.description = "Invalid Link URL"
      return false
    }
    if (!text || text.trim() == "") {
      this.error = true
      this.props.description = "Invalid Link Text"
      return false
    }

    // this.messages.push(
    //   {
    //     href: href,
    //     text: text
    //   }
    // )

    href = hide_embed ? hideLinkEmbed(href) : href
    let link = hyperlink(text, href)
    this.content = link
    this.props.description = codeBlock(link)
  }
}
