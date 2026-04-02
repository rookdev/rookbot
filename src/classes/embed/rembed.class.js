// @ts-nocheck

// We're gonna base this on Discord's EmbedBuilder
const { EmbedBuilder } = require('discord.js')
const globalFuncs = require('../../utils/primitives/globalFuncs')
const numFuncs = require('../../utils/primitives/numFuncs')

class RookEmbed extends EmbedBuilder {
  // props: import('../../types/embed').EmbedProps

  async init(client) {
    // Get color figured out
    if (
      (!(this.props?.color)) ||
      (this.props?.color && this.props.color.trim() == "") ||
      (this.props.color.trim() == "default")
    ) {
      let color = client.profile?.stripe ?? "#000000"
      let eggs  = require('../../dbs/eggs.json')
      color     = eggs[this.props?.players?.user?.username] ?? color

      this.props.color = color
    }

    // Get author figured out
    if (this.props?.author) {
      let author = {}
      for (let [mprop, dprop] of Object.entries(
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
      // @ts-ignore
      this.props.author = author
    }

    // Get description figured out
    let noDesc    = (!(this.props?.description))
    let undefDesc = (typeof this.props.description === "undefined")
    let nullDesc  = (!(noDesc || undefDesc)) && (! this.props?.description)
    if (noDesc || undefDesc || nullDesc) {
      this.props.description = " "
    }
    if (typeof this.props.description == "object") {
      // @ts-ignore
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

    // Initialize EmbedPlayers
    this.props.players = {
      bot:    {},
      user:   {},
      target: {}
    }
  }

  constructor(client, props = {}) {
    super()

    // Get props
    this.props = {...props}
    this.init(client)

    if (this.props?.error && this.props.error) {
      if (!this.props?.title) {
        this.props.title = { text: "" }
      }
      this.props.title.text = "Error"
      this.props.color = client.profile.colors.error
    }

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
      avatar: client.user?.displayAvatarURL({ size: 128 })
    }

    if (!(props?.players)) {
      props.players = {
        bot: bot
      }
    } else if (!(props?.players?.bot)) {
      props.players.bot = bot
    }

    let avatars = {}
    for (let entity of ["bot","user","target"]) {
      if (props.players[entity]) {
        avatars[entity] = {
          type:   entity,
          name:   props?.players[entity]?.name    ? props.players[entity].name    : "",
          url:    props?.players[entity]?.url     ? props.players[entity].url     : `http://example.com/${entity}`,
          avatar: props?.players[entity]?.avatar  ? props.players[entity].avatar  : ""
        }
      }
    }
    avatars.thumbnail = {}
    avatars.author    = { name: "" }

    // Default; put Bot in Thumbnail
    avatars.thumbnail = avatars.bot

    // Have a User, move Bot to Author
    if(avatars?.user?.avatar && avatars.user.avatar != "") {
      avatars.author = avatars.bot
      avatars.thumbnail = avatars.user

      if(avatars?.target?.avatar && avatars.target.avatar != "") {
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
        if (typeof avatars.author.avatar === "string") {
          if (avatars.author.avatar.trim() != "") {
            author.iconURL = avatars.author.avatar.trim()
          }
        }
      }
      this.setAuthor(author)
    }

    if (this.props.thumbnail?.image == "<NONE>") {
      avatars.thumbnail.avatar = ""
    }

    if (avatars.thumbnail.avatar != "") {
      // Set thumbnail
      if (
        (avatars.thumbnail.avatar) &&
        (typeof avatars.thumbnail.avatar == "string")
      ) {
        this.setThumbnail(avatars.thumbnail.avatar)
      }
    }

    // console.log(avatars)

    // Set title
    if (this.props?.title) {
      let hasEmoji  = this.props.title?.emoji
      let hasText   = this.props.title?.text && this.props.title.text != "<NONE>"
      let hasURL    = this.props.title?.url
      let text      = hasText ? this.props.title.text : ""

      if (hasText || hasURL) {
        if (hasEmoji) {
          text = `${this.props.title.emoji}${text}`
        }
        if (hasURL && !hasText) {
          text = "URL"
        }
        this.setTitle(text.trim())
        if (hasURL) {
          // @ts-ignore
          this.setURL(this.props.title.url.trim())
        }
      }
    }

    let footerNone = this.props.footer?.text && this.props.footer.text == "<NONE>"
    let footerDev = client.profile?.DEV && client.profile.DEV
    // Hack footer for PROD Mode
    if (!(footerDev || footerNone)) {
      let profileFooterText = client.profile.footer?.text && client.profile.footer.text != "" ? client.profile.footer.text : ""
      let profileFooterImage = client.profile.footer?.image && client.profile.footer.image != "" ? client.profile.footer.image : ""
      if (!this.props?.footer) {
        this.props.footer = {
          text: "",
          image: ""
        }
      }
      if (profileFooterText != "" && this.props.footer.text != "") {
        this.props.footer.text = this.props.footer.text + " • " + profileFooterText
      } else {
        this.props.footer.text = profileFooterText
      }
      if (profileFooterImage != "" && this.props.footer.image != "") {
        this.props.footer.image = this.props.footer.image
      } else {
        this.props.footer.image = profileFooterImage
      }
    }

    // Hack footer for DEV Mode
    if (footerDev && !footerNone) {
      // If we're in Development Mode
      //  Move the footer text to the end of the description
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

    if (!footerNone) {
      // Make sure version number is in the footer text
      let versionText = `[v${client.profile.PACKAGE.version}]`
      if (this.props.footer?.text) {
        if (this.props.footer.text.indexOf(versionText) == -1) {
          this.props.footer.text += " " + versionText
        }
      } else {
        this.props.footer = {
          text: versionText
        }
      }
    }

    // Set description
    // Array.join() if it's an array
    if (
      this.props?.description &&
      this.props.description &&
      this.props.description != ""
    ) {
      let desc = this.props.description
      if (typeof desc === "object") {
        desc = desc.join("\n")
      }
      this.setDescription(desc)
    }

    // Set fields
    // Fields should be an array of arrays
    // Each top-level is a row
    // Make them all inline
    // Fill each row to three with dummy fields
    if (this.props?.fields) {
      let fields = []
      for (let fieldRow of this.props.fields) {
        let i = 0
        // @ts-ignore
        if (fieldRow && fieldRow.length > 0) {
          // @ts-ignore
          for (let field of fieldRow) {
            if (field) {
              if (
                field?.name &&
                field.name.trim() != "" &&
                field?.value
              ) {
                let field_value = field.value
                if (
                  typeof field_value === "object" &&
                  field_value?.length > 0
                ) {
                  field_value = field_value.join("\n")
                }
                field_value += ""
                fields.push(
                  {
                    name:   field.name.trim(),
                    value:  field_value,
                    // @ts-ignore
                    inline: fieldRow.length > 1
                  }
                )
                i += 1
              }
            }
          }
          if (i > 1 && i < 3) {
            for (; i < 3; i++) {
              fields.push(
                {
                  name:   client.profile.emojis.null,
                  value:  client.profile.emojis.null,
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
      let hasText = this.props.footer?.text && !footerNone
      let hasIcon = this.props.footer?.image && !footerNone

      if (!hasText) {
        this.props.footer.text = client.profile.emojis.null
      }

      if (hasText || hasIcon) {
        let footer = { text: this.props.footer.text }
        if (this.props.footer?.image) {
          footer.iconURL = this.props.footer.image
        }
        this.setFooter(footer)
      }
    }

    // Set timestamp
    if (this.props?.timestamp) {
      let doTimestamp = this.props?.timestamp
      let isTimestamp = numFuncs.myIsNumeric(this.props.timestamp)

      if (isTimestamp) {
        // @ts-ignore
        this.setTimestamp(this.props.timestamp)
      } else if (doTimestamp) {
        this.setTimestamp()
      }
    }
  }
}

exports.RookEmbed = RookEmbed
