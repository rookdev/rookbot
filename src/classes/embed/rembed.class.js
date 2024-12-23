const { EmbedBuilder } = require('discord.js')
const { RookClient } = require('../objects/rclient.class')

function isNumeric(n) {
  let isaN      = !isNaN(n)
  let isBool    = typeof n === "boolean"
  let isStr     = typeof n === "string"
  let isNumStr  = (
    isStr &&
    ((n.replace(/\D/g, '') + "") == (n + ""))
  )

  return (isaN || isNumStr) && !isBool
}

/**
 * @class
 * @classdesc Build a Rook-branded Embed
 * @this {RookEmbed}
 * @extends {EmbedBuilder}
 * @public
 */
class RookEmbed extends EmbedBuilder {
  /**
   * @typedef   {Object}  EmbedAuthor Embed Author (top line in white)
   * @property  {string}  text        Author Text (Name)
   * @property  {string}  [image]     Author Image (Avatar)
   * @property  {string}  [url]       Author URL (Hyperlink)
   */

  /**
   * @typedef   {Object}  EmbedThumbnail  Embed Thumbnail (image to right)
   * @property  {string}  image           Thumbnail Image URL
   */

  /**
   * @typedef   {Object}  EmbedTitle  Embed Title (top line below author, blue if URL added)
   * @property  {string}  text        Title Text
   * @property  {string}  [emoji]     Title Emoji
   * @property  {string}  [url]       Title URL
   */

  /**
   * @typedef   {Object}  EmbedField
   * @property  {string}  name      Field Name
   * @property  {string}  value     Field Value
   * @property  {boolean} [inline]  Inline?
   */

  /**
   * @typedef   {Object}  EmbedImage  Embed Image (image in description, after fields, before footer)
   * @property  {string}  image       Image URL
   */

  /**
   * @typedef   {Object}  EmbedFooter Embed Footer
   * @property  {string}  text        Footer Text
   * @property  {string}  [image]     Footer Image URL
   */

    /**
   * @typedef {Object} EmbedPlayer Player
   * @property {string} name The name
   * @property {string} url The URL
   * @property {string} avatar The Avatar
   */

    /**
   * @typedef   {Object}              EmbedProps
   * @property  {string}              [color]       Embed Color
   * @property  {EmbedAuthor}         [author]      Embed Author
   * @property  {EmbedThumbnail}      [thumbnail]   Embed Thumbnail
   * @property  {EmbedTitle}          [title]       Embed Title
   * @property  {string}              [description] Embed Description
   * @property  {Array.<EmbedField>}  [fields]      Embed Fields
   * @property  {EmbedImage}          [image]       Embed Image
   * @property  {EmbedFooter}         [footer]      Embed Footer
   * @property  {number | null}       [timestamp]   Embed Timestamp
   * @property  {{bot:EmbedPlayer,user:EmbedPlayer,target:EmbedPlayer}} [players]     Embed Players
   * @property  {number}              [flags]       Embed Flags
   * @property  {boolean}             [ephemeral]   Ephemeral?
   * @property  {boolean}             [full]        Full Embed?
   */

  // Member properties
  /** @type {EmbedProps} Embed Properties */
  props;

  /**
   * Initialize sanity checks
   * @param {RookClient} client
   */
  async init(client) {
    // Get color figured out
    if (
      (!(this.props?.color)) ||
      (this.props?.color && this.props.color.trim() == "")
    ) {
      let color = client.profile?.stripe || "#000000"
      let eggs  = require('../../dbs/eggs.json')
      color     = eggs[this.props?.players?.user?.username] || color

      this.props.color = color
    }

    // Get author figured out
    if (this.props?.author) {
      let author = {}
      for (let [mprop, dprop] in Object.entries(
        {
          text:   "name",
          image:  "iconURL",
          url:    "url"
        }
      )) {
        if (this.props.author[mprop]) {
          author[dprop] = this.props.author[mprop].trim()
        }
      }
      this.props.author = author
    }

    // Get description figured out
    // All Hail the Bold Space
    let noDesc    = (!(this.props?.description))
    let undefDesc = (typeof this.props.description === "undefined")
    let nullDesc  = (!(noDesc || undefDesc)) && (! this.props?.description)
    if (noDesc || undefDesc || nullDesc) {
      this.props.description = " "
    }
    if (typeof this.props.description == "object") {
      this.props.description = this.props.description.join("\n")
    }

    // Get Ephemeral figured out
    this.ephemeral = this.props?.ephemeral && this.props.ephemeral

    // Get full-size figured out
    if (!this.props?.full) {
      this.props.full = true
    }

    // Get timestamp figured out
    if (!this.props?.timestamp) {
      this.props.timestamp = true
    }

    this.props.players = {
      bot:    {},
      user:   {},
      target: {}
    }
  }

  /**
   * Constructor
   * @param {RookClient} client
   * @param {(EmbedProps | Object.<any>)} props Local list of command properties
   */
  constructor(client, props = {}) {
    super()

    // Get props
    this.props = {...props}
    this.init(client)

    // Set color
    if (this.props?.color) {
      this.setColor(this.props.color.trim())
    }

    // Set players
    // Avatars
    //  Default: Bot as Thumbnail
    //  Custom Thumbnail: Bot as Author
    //  Custom Thumbnail & Custom Author: No Bot

    let bot = {
      name: "Bot",
      avatar: client.profile?.defaults?.thumbnail.trim()
    }
    if (!(props?.players)) {
      props.players = {
        bot: bot
      }
    } else if (!(props?.players?.bot)) {
      props.players.bot = bot
    }

    let avatars = {
      bot: {
        type:   "bot",
        name:   props.players.bot.name,
        url:    props?.players?.bot?.url && props.players.bot.url.trim() != "" ? props.players.bot.url.trim() : "http://example.com/bot",
        avatar: props.players.bot.avatar
      },
      user: {
        type:   "user",
        name:   props?.players?.user?.name && props.players.user.name.trim() != "" ? props.players.user.name.trim() : "",
        url:    props?.players?.user?.url && props.players.user.url.trim() != "" ? props.players.user.url.trim() : "http://example.com/user",
        avatar: props?.players?.user?.avatar && props.players.user.avatar.trim() != "" ? props.players.user.avatar.trim() : ""
      },
      target: {
        type:   "target",
        name:   props?.players?.target?.name && props.players.target.name.trim() != "" ? props.players.target.name.trim() : "",
        url:    props?.players?.target?.url && props.players.target.url.trim() != "" ? props.players.target.url.trim() : "http://example.com/target",
        avatar: props?.players?.target?.avatar && props.players.target.avatar.trim() != "" ? props.players.target.avatar.trim() : ""
      },
      thumbnail: {},
      author: { name: "" }
    }

    // Default; put Bot in Thumbnail
    avatars.thumbnail = avatars.bot

    // Have a User, move Bot to Author
    if(avatars.user.avatar != "") {
      avatars.author = avatars.bot
      avatars.thumbnail = avatars.user

      if(avatars.target.avatar != "") {
        // Have a Target, move User to Author
        avatars.author = avatars.user
        avatars.thumbnail = avatars.target
      }
    }

    // Set author
    let author = {}
    if (props?.caption?.text && props.caption.text.trim() != "") {
      author.name = props.caption.text
    } else if (avatars.author.name) {
      author.name = avatars.author.name
    } else {
      author.name = ""
    }
    if (props?.caption?.url && props.caption.url.trim() != "") {
      author.url = props.caption.url
    } else if (avatars.author.url) {
      author.url = avatars.author.url
    }
    if (author && author.name != "") {
      if (avatars?.author?.avatar) {
        author.iconURL = avatars.author.avatar
      }
      this.setAuthor(author)
    }

    // Set thumbnail
    this.setThumbnail(avatars.thumbnail.avatar)

    // Set title
    if (this.props?.title) {
      let hasEmoji  = this.props.title?.emoji
      let hasText   = this.props.title?.text
      let hasURL    = this.props.title?.url
      let text      = this.props.title?.text ? this.props.title.text : "No Title"

      if (hasText || hasURL) {
        if (hasEmoji) {
          text = `${this.props.title.emoji}${text}`
        }
        this.setTitle(text.trim())
        if (hasURL) {
          this.setURL(this.props.title.url.trim())
        }
      }
    }

    // Hack footer
    if (client.profile?.DEV && client.profile.DEV) {
      if (client.profile?.footer) {
        if (this.props?.footer?.text) {
          if (this.props.description != "") {
            this.props.description += "\n\n"
          }
          this.props.description += ">>" + this.props.footer.text
        }
        this.props.footer = client.profile.footer
      }
    }

    // Set description
    if (
      this.props?.description &&
      this.props.description &&
      this.props.description != ""
    ) {
      this.setDescription(this.props.description)
    }

    // Set fields
    if (this.props?.fields) {
      let fields = []
      for (let fieldRow of this.props.fields) {
        let i = 0
        if (fieldRow && fieldRow.length > 0) {
          for (let field of fieldRow) {
            if (field) {
              fields.push(
                {
                  name:   field.name.trim(),
                  value:  field.value + "",
                  inline: fieldRow.length > 1
                }
              )
              i += 1
            }
          }
          if (i > 1 && i < 3) {
            for (; i < 3; i++) {
              fields.push(
                {
                  name:   " ",
                  value:  " ",
                  inline: true
                }
              )
            }
          }
        }
      }
      if (fields.length) {
        this.setFields(fields)
      }
    }

    // Set image
    if (
      this.props?.image?.image &&
      this.props.image.image &&
      this.props.image.image.trim() != ""
    ) {
      this.setImage(this.props.image.image.trim())
    }

    // Set footer
    if (this.props?.footer) {
      let hasText = this.props.footer?.text
      let hasIcon = this.props.footer?.image

      // All Hail the Bold Space
      if (!hasText) {
        this.props.footer.text = " "
      }

      if (hasText || hasIcon) {
        let footer = { text: this.props.footer.text.trim() }
        if (this.props.footer?.image) {
          footer.image = this.props.footer.image.trim()
        }
        this.setFooter(footer)
      }
    }

    // Set timestamp
    if (this.props?.timestamp) {
      let doTimestamp = this.props?.timestamp
      let isTimestamp = isNumeric(this.props.timestamp)

      if (isTimestamp) {
        this.setTimestamp(this.props.timestamp.trim())
      } else if (doTimestamp) {
        this.setTimestamp()
      }
    }
  }
}

exports.RookEmbed = RookEmbed
