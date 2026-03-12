const { MessageFlags } = require('discord.js')
const { Pagination } = require('pagination.djs')
const { RookEmbed } = require('../../classes/embed/rembed.class')
const { RookPlain } = require('../../classes/embed/rplain.class')
const { SlimEmbed } = require('../../classes/embed/rslimbed.class')
const { setValue } = require("../../utils/primitives/globalFuncs")
const getters = require('../../utils/guild/getters')

class RookMessage {
  constructor(client, interaction, mprops) {
    this.client = client
    this.interaction = interaction ?? null

    this.channelName  = setValue(mprops.channelName, "bot-console")
    this.content      = setValue(mprops.content, "")
    this.pages        = setValue(mprops.pages, [])
    this.ephemeral    = setValue(mprops.ephemeral, false)

    this.name = "Message"
    this.messages = []
    this.error = false
    this.testPageNum = 0
  }

  async getChannel() {
    let parent = this.client
    if (this.interaction?.id && this.interaction.id != 0) {
      parent = await this.getGuild(this.client, this.interaction)
    }
    return await getters.getCache(
      this.client,
      parent,
      "channels",
      this.channelName
    )
  }

  async getProp(client, parent, propName) {
    return await getters.getProp(client, parent, propName)
  }

  async getGuild(client, parent) {
    return await getters.getGuild(client, parent)
  }

  async makeStoat(this_package) {
    let stoat_package = this_package
    let stoat_content = []

    if (stoat_package.embeds) {
      stoat_package.embeds = stoat_package.embeds.map(
        embed => embed?.data
        ? embed.data
        : embed
      )
    }

    let pageNum = 0
    for (let embed of stoat_package.embeds) {
      // if (embed.title) {
      //   stoat_content.push(`**${embed.title}**`)
      //   stoat_content.push("---")
      // }
      if (embed.description) {
        stoat_content.push(embed.description)
      }
      if (embed.fields) {
        let fieldNum = 0
        for (let field of embed.fields) {
          if (field.name != field.value) {
            stoat_content.push(`${field.name}: ${field.value}`)
          }
          if (fieldNum > 0 && fieldNum % 3 == 0) {
            stoat_content.push("---")
          }
          fieldNum += 1
        }
      }
      if (embed.footer) {
        stoat_content.push("---")
        let footer = ""
        if (embed.footer?.icon_url) {
          footer += `![Footer Image](${embed.footer.icon_url}) `
        }
        if (embed.footer?.text) {
          footer += embed.footer.text
        }
        stoat_content.push(footer)
        // stoat_content.push(JSON.stringify(embed.footer))
      }
      stoat_package.embeds[pageNum].description = stoat_content
        .join("\n")
        .replaceAll("```\n",  "")
        .replaceAll("```",    "")
      pageNum += 1
    }

    if (!stoat_package.attachments) {
      stoat_package.attachments = []
    }

    // console.log(stoat_package)
    return stoat_package
  }

  async handle_deferrment() {
    let hasDeferred = this.interaction?.deferred
    let hasReply    = this.interaction?.replied
    let canDefer    = typeof this.interaction?.deferReply === "function"

    // Defer if needed
    if (!hasDeferred && !hasReply && canDefer) {
      let deferMsg = ""
      deferMsg = `/${this.name}: Deferring Reply`
      // Note if needs to be Ephemeral
      if (this.ephemeral) {
        deferMsg += " [Ephemeral]"
      }
      if (deferMsg != "") {
        this.messages.push(deferMsg)
      }
      let intOptions = {}
      if (this.ephemeral) {
        intOptions = { flags: MessageFlags.Ephemeral }
      }
      if (this.interaction?.id) {
        try {
          await this.interaction.deferReply(intOptions)
        } catch (err) {
          // do nothing
        }
      }
      hasDeferred = true
    }

    return hasDeferred
  }
  async handle_interaction(this_package, hasDeferred=false) {
    let isEphemeral = this_package?.ephemeral
    let hasReply    = this.interaction?.replied
    let canEdit     = this.interaction?.id && typeof this.interaction?.editReply === "function"
    let canReply    = this.interaction?.id && typeof this.interaction?.reply === "function"
    let canFollowUp = this.interaction?.id && typeof this.interaction?.followUp === "function"

    if (!hasDeferred) {
      hasDeferred = this.interaction?.deferred || await this.handle_deferrment()
    }

    if (
      [
        "stoat"
      ].includes(this.client.platform)
    ) {
      let stoat_package = await this.makeStoat(this_package)
      this_package = stoat_package
    }

    let handle_result = false

    // editReply "thinking" if first reply
    if (hasDeferred && canEdit && this.interaction?.id) {
      try {
        if (!isEphemeral) {
          this.messages.push(`/${this.name}: Editing Corporeal Reply`)
        } else {
          this.messages.push(`/${this.name}: Editing Ephemeral Reply`)
        }
        handle_result = await this.interaction.editReply(this_package)
      } catch(e) {
        // this.messages.push(e)
        // handle_result = false
      }
    } else if (!hasReply && canReply) {
      // reply if edited "thinking"
      this.messages.push(`/${this.name}: Posting Reply`)
      try {
        handle_result = await this.interaction.reply(this_package)
      } catch(e) {
        // this.messages.push(e.stack)
        handle_result = false
      }
    } else if (hasReply && canFollowUp) {
      // followup if already replied
      this.messages.push(`/${this.name}: Posting Follow-Up`)
      try {
        handle_result = await this.interaction.followUp(this_package)
      } catch(e) {
        // this.messages.push(e.stack)
        handle_result = false
      }
    }

    if (!handle_result && isEphemeral && canFollowUp && interaction?.id) {
      // send followup and delete reply
      this.messages.push(`/${this.name}: Sending Ephemeral & Deleting Interaction`)
      handle_result = await this.interaction.followUp(this_package)
      await this.interaction.deleteReply()
    }

    if (!handle_result) {
      if (this.interaction?.channel) {
        this.messages.push(`/${this.name}: Sending to Interaction's Channel`)
        try {
          if (
            [
              "stoat"
            ].includes(this.client.platform)
          ) {
            let stoat_package = await this.makeStoat(this_package)
            this_package = stoat_package
          }
          handle_result = await this.interaction.channel.send(this_package)
        } catch (err) {
          if (!["50035"].includes((err.code + ""))) {
            this.messages.push(err, err.stack)
          }
        }
      }
    }

    return handle_result
  }
  async print_it() {
    this.messages.push(`/${this.name}: Print it...`)

    // If no page, set to built Embed Properties
    if (!this.pages || (this.pages.length == 0)) {
      this.pages = [ this.props ]
    }

    // If only props, make it an array
    if (!this.pages.length) {
      this.pages = [ this.pages ]
    }

    // If we've got pages
    if (this.pages) {
      let i = 0
      // Cycle through them
      for (let page of this.pages) {
        // Initialize Entities
        if (!page?.entities) {
          page.entities = {}
        }
        // Default PlayerTypes to Bot|Caller
        if (!page?.playerTypes) {
          page.playerTypes = {
            user: "bot",
            target: "caller"
          }
        }
        // Discord Entity
        page.entities.discord = {
          type:   "discord",
          id:     0,
          name:   "Discord",
          url:    "http://example.com/discord",
          avatar: "https://cdn.iconscout.com/icon/free/png-512/free-discord-logo-icon-download-in-svg-png-gif-file-formats--social-media-pack-logos-icons-3073764.png?f=webp&w=256",
          tag:    "discord"
        }
        // Stoat Entity
        page.entities.stoat = {
          type:   "stoat",
          id:     0,
          name:   "Stoat",
          url:    "http://example.com/stoat",
          tag:    "stoat"
        }
        // Fluxer Entity
        page.entities.fluxer = {
          type:   "fluxer",
          id:     0,
          name:   "Fluxer",
          url:    "http://example.com/fluxer",
          tag:    "fluxer"
        }

        // Bot Entity
        page.entities.bot = {
          type:   "bot",
          id:     this.client.user?.id,
          name:   this.client.user?.displayName,
          url:    "http://example.com/bot",
          avatar: await this.client.user?.displayAvatarURL({ size: 128 }),
          tag:    this.client.user?.tag
        }

        let guild = await this.getGuild(this.client, this.interaction)
        // Get Guild version of Client User
        let clientMember = guild?.members.me
        // Guild Client Entity
        if (clientMember) {
          page.entities.botMember = {
            type:   "botMember",
            id:     clientMember.id,
            name:   clientMember.displayName,
            url:    "http://example.com/botMember",
            avatar: await clientMember.displayAvatarURL({ size: 128 }),
            tag:    clientMember.user.tag
          }
        }
        // If there's no Guild Entity set yet
        //  Set it
        if ((!page.entities?.guild) && (guild)) {
          page.entities.guild = {
            type:   "guild",
            id:     guild.id,
            name:   guild.name,
            url:    "http://example.com/guild",
            avatar: [
              "stoat"
            ].includes(this.client.platform)
            ? ""
            : await guild.iconURL({ size: 128 })
          }
        }

        // If we've got an Interaction
        if (this.interaction?.id) {
          // Get Guild version of Caller
          let callerMember = await this.interaction?.member

          if (this.interaction?.user) {
            // Caller Entity
            page.entities.caller = {
              type:   "caller",
              id:     this.interaction.user.id,
              name:   this.interaction.user.displayName,
              url:    "http://example.com/caller",
              tag:    this.interaction.user.tag
            }
            if (typeof this.interaction.user?.displayAvatarURL === "function") {
              page.entities.caller.avatar = await this.interaction.user.displayAvatarURL({ size: 128 })
            }
          }

          // Guild Caller Entity
          if (callerMember) {
            page.entities.callerMember = {
              type:   "callerMember",
              id:     callerMember.id,
              name:   callerMember.displayName,
              url:    "http://example.com/callerMember",
              tag:    callerMember.user?.tag
            }
            if (typeof callerMember?.displayAvatarURL === "function") {
              page.entities.callerMember.avatar = await callerMember.displayAvatarURL({ size: 128 })
            }
          }
        }

        // Prefer Member version over Base version
        for (let playerType of ["user", "target"]) {
          for (let entityType of ["bot", "caller"]) {
            if (page.playerTypes[playerType] == entityType) {
              let memberType = entityType + "Member"
              if (page.entities[memberType]) {
                page.playerTypes[playerType] = memberType
              }
            }
          }
        }

        // Set User & Target Players
       page.players = {
          user: page.entities[page.playerTypes.user],
          target: page.entities[page.playerTypes.target]
        }

        // this.messages.push(
        //   JSON.stringify(
        //     {
        //       entities: page.entities,
        //       playerTypes: page.playerTypes,
        //       players: page.players
        //     }
        //   )
        // )

        // If it's Ephemeral, all need to be Ephemeral
        if (page?.ephemeral && page.ephemeral) {
          // this.messages.push(`/${this.name}: Page ${i} is Ephemeral`)
          this.ephemeral = true
        }

        // Build Printing message
        let msg = `/${this.name}: Printing `
        if (page?.full && !page.full) {
          msg += "slimbed "
          this.pages[i] = await new SlimEmbed(this.client, page)
        } else if (page?.plain && page.plain) {
          msg += "plain   "
          this.pages[i] = await new RookPlain(client, page)
        } else {
          msg += "embed   "
          this.pages[i] = await new RookEmbed(this.client, page)
        }
        msg += ((i+1)+"").padStart(2,'0')
        msg += '/'
        msg += ((this.pages.length)+"").padStart(2,'0')
        msg += "..."
        let title = page?.caption?.text ?? page?.title?.text ?? ""
        msg += `[${title}]`
        this.messages.push(msg)
        i += 1
      }

      // Return the pages we built
      return this.pages
    }

    // If we didn't build pages,
    //  Return whether or not we generated an error
    return !this.error
  }
  async ship_it(independent=false, hasDeferred=false) {
    this.messages.push(`/${this.name}: ...and Ship it!`)



    // Base package is just the pages
    let this_package = { embeds: this.pages }
    // If we've got Message Content, set it
    if (this.content && this.content != "") {
      this.messages.push(`/${this.name}: ...with more Content!`)
      this_package.content = this.content
    } else {
      this_package.content = "** **"
    }

    // If we've got more than one page, paginate it
    if (this.pages.length > 1) {
      // We're only paginating Embed objects
      // We're setting the footer to include the page number
      this.messages.push(`/${this.name}: Binding a Book with ${this.pages.length} Pages`)
      let these_pagination = await new Pagination(this.interaction)
      // Set to all users for control
      these_pagination.setAuthorizedUsers([])
      these_pagination.setEmbeds(
        this.pages,
        (page, index, array) => {
          let this_footer = page.toJSON()?.footer
          if (this_footer) {
            if (this_footer.text) {
              this_footer.text = ` • ${this_footer.text}`
            }
            this_footer.text = `Page: ${index+1}/${array.length}${this_footer.text}`
            if (this_footer?.icon_url && (this_footer.icon_url != "")) {
              this_footer.iconURL = this_footer.icon_url
            }
          }
          return page.setFooter(this_footer)
        }
      )
      these_pagination.render()
      this_package = {
        content: "** **",
        embeds: [ these_pagination ]
      }
    }

    // If it's gonna be Ephemeral, set it
    if (this.ephemeral) {
      this_package.flags = MessageFlags.Ephemeral
      this_package.ephemeral = true
    }

    // Handle the interaction
    //  Send it if interaction exists and not forced to be independent
    let interaction_result = false
    if (this.interaction?.id && !independent) {
      interaction_result = await this.handle_interaction(
        this_package,
        hasDeferred
      )
    }

    // If we didn't sent it earlier
    //  We either failed to have an interaction object or
    //   We're forcing it to be independent
    let send_result = false
    if (!interaction_result) {
      try {
        let channelGuild = await this.getGuild(this.client, this.channel)
        this.messages.push(`/${this.name}: Posting Independent to '${this.channel?.name}' of '${channelGuild?.name}'`)
        if (
          [
            "stoat"
          ].includes(this.client.platform)
        ) {
          let stoat_package = await this.makeStoat(this_package)
          this_package = stoat_package
        }
        send_result = await this.channel.send(this_package)
      } catch(e) {
        this.messages.push(e)
        send_result = false
      }
    }

    if (!(interaction_result || send_result)) {
      // this.messages.push(`/${this.name}: Failed to send message! Int: ${interaction_result} Snd: ${send_result}`)
      // await this.interaction.deleteReply()
    }

    return interaction_result || send_result
  }
  async send(independent=false, hasDeferred=false) {
    // this.messages.push(`/${this.name}: Full Send it!`)

    // Print it!
    let printResult = await this.print_it()
    // if (printResult) { this.messages.push(`/${this.name}: Printed!`) }

    // Ship it!
    let shipResult = await this.ship_it(
      independent,
      hasDeferred
    )
    // if (shipResult) { this.messages.push(`/${this.name}: Shipped!`) }

    return printResult && shipResult
  }
  async execute(independent=false) {
    this.channel = await this.getChannel()
    if (this.interaction?.id) {
      if (this.channel?.id != this.interaction?.channel?.id) {
        independent = true
      }
    }
    let sendResult = await this.send(independent)
    // if (sendResult) { this.messages.push(`/${this.name}: Sent!`) }

    console.log(this.messages.join("\n"))

    return sendResult
  }
}

exports.RookMessage = RookMessage
