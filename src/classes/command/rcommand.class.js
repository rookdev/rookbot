// @ts-nocheck

const { MessageFlags, codeBlock, italic } = require('discord.js')            // Message Flags
const { Pagination } = require('pagination.djs')          // Pagination
const { RookEmbed } = require('../embed/rembed.class')    // Rook Embed
const { SlimEmbed } = require('../embed/rslimbed.class')  // Rook Slim Embed
// Pretty-print to console
const AsciiTable = require('ascii-table')
const fileFuncs = require('../../utils/fs/fileFuncs')

const { setValue } = require("../../utils/primitives/globalFuncs")
const stringFuncs = require("../../utils/primitives/stringFuncs")
const numFuncs = require("../../utils/primitives/numFuncs")
const moment = require('moment')

class RookCommand {
  constructor(client, comprops={}, props={}) {
    // Set sent Command properties
    this.name             = setValue(comprops.name, "unknown")
    this.description      = setValue(comprops.description, (this.name.charAt(0).toUpperCase() + this.name.slice(1)))
    this.options          = setValue(comprops.options, [])
    this.category         = setValue(comprops.category, "unknown")
    this.aliases          = setValue(comprops.aliases, [])
    this.defaultOptions   = setValue(comprops.defaultOptions, {})
    this.testOptions      = setValue(comprops.testOptions, [])
    this.testIndependent  = setValue(comprops.testIndependent, false)
    this.channelName      = "bot-console"
    this.access           = setValue(comprops.access, "unset")
    this.permissions      = setValue(comprops.permissions, 0)
    this.botPermissions   = setValue(comprops.botPermissions, this.permissions)
    this.userPermissions  = setValue(comprops.userPermissions, this.permissions)
    this.errors           = require('../../dbs/errors.json')

    // Initialize global properties
    this.profile = client.profile // Loaded Profile
    this.pages = []               // Bucket for Pages to Print
    this.content = ""             // Message Content
    this.error = false            // Did we have an error?
    this.ephemeral = false        // Make sure Ephemeral Response
    this.testPageNum = 0

    // Figure out if we're in Production or Development
    let PROD = false
    let DEV = true
    if (this.profile?.DEV && this.profile.DEV) {
      PROD = false
      DEV = true
    }
    if (process.env.ENV_ACTIVE.startsWith("dev")) {
      PROD = false
      DEV = true
    }
    if (process.env.ENV_ACTIVE.startsWith("prod")) {
      PROD = true
      DEV = false
    }
    this.DEV = !PROD

    // Set sent Embed properties
    this.props = {...props}

    // Default Embed:Full to true
    if (!Object.hasOwn(this.props, "full")) {
      this.props["full"] = true
    }

    // Default Embed:Players to Command:Players
    if (!Object.hasOwn(this.props, "players")) {
      this.props["players"] = this.players
    }

    // Initialize Embed:Entities
    this.props.entities = {}

    // Default Embed:PlayerTypes to Bot|Caller
    this.props.playerTypes = {
      user: "bot",
      target: "caller"
    }
  }

  async botLevelCompare(client, member, silent=false) {
    let msg = ""
    if (!member) {
      if (!silent) {
        this.error = true
        this.props.playerTypes = {
          user: "bot",
          target: "bot"
        }
        msg = `${this.profile.emojis.fail} No member given.`
        this.props.description = msg
        console.log(msg)
      }
      return false
    }

    if (!member?.guild) {
      if (!silent) {
        this.error = true
        this.props.playerTypes = {
          user: "bot",
          target: "target"
        }
        msg = `${this.profile.emojis.fail} No guild found for ${member}.`
        this.props.description = msg
        console.log(msg)
      }
      return false
    }

    if (client.user.id === member.id) {
      return true
    }

    if (member.id === member.guild.ownerId) {
      if (!silent) {
        this.error = true
        this.props.playerTypes = {
          user: "bot",
          target: "target"
        }
        msg = [
          `${this.profile.emojis.fail} Bot can't manage user.`,
          `${this.profile.emojis.fail} ${member} is Owner of ${italic(member.guild.name)}.`
        ]
        this.props.description = msg
      }
      return false
    }

    let clientMember = member.guild.members.me
    if (!clientMember) {
      if (!silent) {
        this.error = true
        this.props.playerTypes = {
          user: "bot",
          target: "bot"
        }
        msg = `${this.profile.emojis.fail} Bot not found in ${italic(member.guild.name)}.`
        this.props.description = msg
      }
      return false
    }

    let clientPos = clientMember.roles.highest.position
    let memberPos = member.roles.highest.position
    if (clientPos <= memberPos) {
      if (!silent) {
        this.error = true
        this.props.playerTypes = {
          user: "bot",
          target: "target"
        }
        msg = [
          `${this.profile.emojis.fail} Bot can't manage user.`,
          `${this.profile.emojis.fail} ${member}'s highest role is greater than or equal to ${clientMember}.`
        ]
        this.props.description = msg
      }
      return false
    }
    return true
  }
  async botCanEdit(client, member, silent=false) {
    let canEdit = member?.manageable && member.manageable
    let msg = ""

    if (!member) {
      if (!silent) {
        this.error = true
        msg = `${this.profile.emojis.fail} No member given.`
        this.props.description = msg
      }
      return false
    }

    canEdit = await this.botLevelCompare(client, member, silent)
    return canEdit
  }
  async botCanMod(client, member, silent=false) {
    let canMod = member?.moderatable && member.moderatable
    let msg = ""

    if (!member) {
      if (!silent) {
        this.error = true
        msg = `${this.profile.emojis.fail} No member given.`
        this.props.description = msg
      }
      return false
    }

    canMod = await this.botLevelCompare(client, member, silent)
    return canMod
  }

  async getChannel(client, interaction, channelTypes) {
    channelTypes = channelTypes ?? [ this.channelName ]

    if (typeof channelTypes != "object") {
      channelTypes = [ channelTypes ]
    }

    let guild = interaction?.guild ?? client.guild
    let guildID = guild?.id
    let channel = null

    let channelIDs = fileFuncs.getAFile(
      [
        "src",
        "dbs",
        guildID
      ],
      "channels.json"
    )

    if (!channelIDs) {
      console.log(`Channel IDs not found for '${guild.name}' [${guild.id}]`)
    }

    for (let channelID of channelTypes) {
      if (channel) {
        continue
      }

      if (channelIDs) {
        // If requested Channel ID is present, set it
        if (Object.keys(channelIDs).includes(channelID)) {
          channelID = channelIDs[channelID]
        }
      }

      // If it's a number
      if (numFuncs.myIsNumeric(channelID)) {
        // Search for Channel object by ChannelID
        channel = await guild?.channels.fetch(channelID)
      } else if (typeof channelID == "string") {
        // Search for Channel object ny Channel Name
        channel = await guild?.channels.cache.find(
          c => c.name === channelID
        )
      }
    }

    return channel
  }

  // FIXME: NYI
  async getEmoji(client, interaction, emojiKey) {
    let emoji = `[${emojiKey}]`

    return emoji
  }

  async action(client, interaction, coptions) {
    console.log(`/${this.name}: Action`)

    if (! this.DEV) {
      // Do the thing
    } else {
      // Describe the thing
    }

    return !this.error
  }

  async build(client, interaction, coptions={}) {
    let buildMsg = `/${this.name}: Rook Build`
    if (this.testPageNum > 0) {
      buildMsg += `: Page ${this.testPageNum}`
    }
    console.log(buildMsg)

    // If we don't have an error yet,
    //  Process canned option values into sent option values
    if (!(this.error)) {
      for (let option of this.options) {
        if ((!(coptions.hasOwnProperty(option.name)))) {
          let thisOption = interaction?.options?.get(option.name)
          if (thisOption) {
            coptions[option.name] = thisOption.value
          }
        }
      }
    }

    if (this.defaultOptions) {
      for (let [optName, optVal] of Object.entries(this.defaultOptions)) {
        if ((!(coptions.hasOwnProperty(optName)))) {
          coptions[optName] = optVal
        }
      }
    }

    // If we've got options sent, print them
    if (coptions && Object.keys(coptions).length > 0) {
      let Table = new AsciiTable(
        `/${this.name} : Build Options`,
        {}
      )
        .setBorder('|','-','•','•')
        .setHeading(
          "Option",
          "Value"
        )
      for (let [oName, oVal] of Object.entries(coptions)) {
        Table.addRow(oName, oVal)
      }
      console.log(Table.toString())
    }

    // Run the action
    let actionResult = await this.action(client, interaction, coptions)

    // if (this.name == "testsuite") {
    //   this.props.description += "\n\n"
    //   this.props.description += codeBlock(Table.toString())
    // }

    // If there's an error
    //  Set it for this set of props
    if (this.error) {
      this.props.error = true
    }

    return actionResult && !this.error
  }

  async handle_deferrment(interaction) {
    let hasDeferred = interaction?.deferred
    let hasReply    = interaction?.replied
    let canDefer    = typeof interaction?.deferReply === "function"

    // Defer if needed
    if (!hasDeferred && !hasReply && canDefer) {
      let deferMsg = `/${this.name}: Deferring Reply`
      // Note if needs to be Ephemeral
      if (this.ephemeral) {
        deferMsg += " [Ephemeral]"
      }
      console.log(deferMsg)
      let intOptions = {}
      if (this.ephemeral) {
        intOptions = { flags: MessageFlags.Ephemeral }
      }
      await interaction.deferReply(intOptions)
      hasDeferred = true
    }

    return hasDeferred
  }

  async handle_interaction(interaction, this_package, hasDeferred=false) {
    let isEphemeral = this_package.ephemeral
    let hasReply    = interaction?.replied
    let canEdit     = typeof interaction?.editReply === "function"
    let canReply    = typeof interaction?.reply === "function"
    let canFollowUp = typeof interaction?.followUp === "function"

    if (!hasDeferred) {
      hasDeferred = interaction?.deferred || await this.handle_deferrment(interaction)
    }

    let handle_result = false

    // editReply "thinking" if first reply
    if (hasDeferred && canEdit) {
      try {
        if (!isEphemeral) {
          console.log(`/${this.name}: Editing Corporeal Reply`)
          await interaction.editReply(this_package)
          handle_result = true
        } else {
          console.log(`/${this.name}: Editing Ephemeral Reply`)
          await interaction.editReply(this_package)
          handle_result = true
        }
      } catch(e) {
        // console.log(e)
        // handle_result = false
      }
      handle_result = true
    } else if (!hasReply && canReply) {
      // reply if edited "thinking"
      console.log(`/${this.name}: Posting Reply`)
      try {
        await interaction.reply(this_package)
        handle_result = true
      } catch(e) {
        // console.log(e)
        handle_result = false
      }
    } else if (hasReply && canFollowUp) {
      // followup if already replied
      console.log(`/${this.name}: Posting Follow-Up`)
      try {
        await interaction.follwUp(this_package)
        handle_result = true
      } catch(e) {
        // console.log(e)
        handle_result = false
      }
    }

    if (!handle_result && isEphemeral) {
      // send followup and delete reply
      console.log(`/${this.name}: Sending Ephemeral & Deleting Interaction`)
      console.log(this_package)
      await interaction.followUp(this_package)
      await interaction.deleteReply()
      handle_result = true
    }

    return handle_result
  }

  async print_it(client, interaction, pages) {
    console.log(`/${this.name}: Print it...`)

    // If no page, set to built Embed Properties
    if (!pages || (pages.length == 0)) {
      pages = [ this.props ]
    }

    // If we've got pages
    if (pages) {
      let i = 0
      // Cycle through them
      for (let page of pages) {
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

        // Bot Entity
        page.entities.bot = {
          type:   "bot",
          id:     client.user.id,
          name:   client.user.displayName,
          url:    "http://example.com/bot",
          avatar: client.user.displayAvatarURL({ size: Math.pow(2, 7) }),
          tag:    client.user.tag
        }

        // If we've got an Interaction
        if (interaction) {
          // Get Guild version of Client User
          let clientMember = interaction.guild?.members.me
          // Get Guild version of Caller
          let callerMember = await interaction?.member

          // Guild Client Entity
          if (clientMember) {
            page.entities.botMember = {
              type:   "botMember",
              id:     clientMember.id,
              name:   clientMember.displayName,
              url:    "http://example.com/botMember",
              avatar: clientMember.displayAvatarURL({ size: Math.pow(2, 7) }),
              tag:    clientMember.user.tag
            }
          }

          if (interaction?.user) {
            // Caller Entity
            page.entities.caller = {
              type:   "caller",
              id:     interaction.user.id,
              name:   interaction.user.displayName,
              url:    "http://example.com/caller",
              tag:    interaction.user.tag
            }
            if (typeof interaction.user?.displayAvatarURL === "function") {
              page.entities.caller.avatar = interaction.user.displayAvatarURL({ size: Math.pow(2, 7) })
            }
          }

          // Guild Caller Entity
          if (callerMember) {
            page.entities.callerMember = {
              type:   "callerMember",
              id:     callerMember.id,
              name:   callerMember.displayName,
              url:    "http://example.com/callerMember",
              tag:    callerMember.user.tag
            }
            if (typeof callerMember?.displayAvatarURL === "function") {
              page.entities.callerMember.avatar = callerMember.displayAvatarURL({ size: Math.pow(2, 7) })
            }
          }

          // If there's no Guild Entity set yet
          //  Set it
          if ((!page.entities?.guild) && (interaction?.guild)) {
            page.entities.guild = {
              type:   "guild",
              id:     interaction.guild.id,
              name:   interaction.guild.name,
              url:    "http://example.com/guild",
              avatar: interaction.guild.iconURL({ size: Math.pow(2, 7) })
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

        // If it's Ephemeral, all need to be Ephemeral
        if (page?.ephemeral && page.ephemeral) {
          // console.log(`/${this.name}: Page ${i} is Ephemeral`)
          this.ephemeral = true
        }

        // Build Printing message
        let msg = `/${this.name}: Printing `
        if (page?.full && !page.full) {
          msg += "slimbed "
          this.pages[i] = await new SlimEmbed(client, page)
        } else {
          msg += "embed   "
          this.pages[i] = await new RookEmbed(client, page)
        }
        msg += ((i+1)+"").padStart(2,'0')
        msg += '/'
        msg += ((pages.length)+"").padStart(2,'0')
        msg += "..."
        let title = page?.caption?.text ?? page?.title?.text ?? ""
        msg += `[${title}]`
        console.log(msg)
        i += 1
      }

      // Return the pages we built
      return this.pages
    }

    // If we didn't build pages,
    //  Return whether or not we generated an error
    return !this.error
  }

  async ship_it(interaction, independent=false, hasDeferred=false) {
    console.log(`/${this.name}: ...and Ship it!`)

    // Base package is just the pages
    let this_package = { embeds: this.pages }
    // If we've got Message Content, set it
    if (this.content && this.content != "") {
      this_package.content = this.content
    }

    // If we've got more than one page, paginate it
    if (this.pages.length > 1) {
      // We're only paginating Embed objects
      // We're setting the footer to include the page number
      console.log(`/${this.name}: Binding a Book with ${this.pages.length} Pages`)
      let these_pagination = await new Pagination(interaction)
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
            return page.setFooter(this_footer)
          }
          return page.setFooter()
        }
      )
      these_pagination.render()
      this_package = {
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
    if (interaction && !independent) {
      interaction_result = await this.handle_interaction(
        interaction,
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
        console.log(`/${this.name}: Posting Independent`)
        await this.channel.send(this_package)
        send_result = true
      } catch(e) {
        // console.log(e)
        send_result = false
      }
    }

    return interaction_result || send_result
  }

  async send(client, interaction, pages, independent=false, hasDeferred=false) {
    console.log(`/${this.name}: Full Send it!`)

    // Print it!
    let printResult = await this.print_it(client, interaction, pages)
    // if (printResult) { console.log(`/${this.name}: Printed!`) }

    // Ship it!
    let shipResult = await this.ship_it(
      interaction,
      independent,
      hasDeferred
    )
    // if (shipResult) { console.log(`/${this.name}: Shipped!`) }

    return printResult && shipResult
  }

  async execute(client, interaction, coptions, independent=false) {
    // Print data about the calling of this command
    let now = moment.utc()
    let dateTable = new AsciiTable(
      `/${this.name}`,
      {}
    )
    // UTC
    now.utc()
    dateTable.addRow(now.format())
    // Local
    now.local()
    dateTable.addRow(now.format())
    console.log(dateTable.toString())

    let Table = new AsciiTable("", {})
      .setHeading(
        "",
        "Name",
        "ID"
      )
      .setAlign(2, AsciiTable.RIGHT)
      .setBorder('|','-','•','•')
      // Guild it was in
      .addRow(
        "Guild",
        interaction?.member?.guild?.name,
        interaction?.guildId
      )
      // Channel it was in
      .addRow(
        "Channel",
        await interaction?.channel?.name,
        interaction?.channelId
      )
      // Interaction associated with it
      .addRow(
        "Interaction",
        interaction ? this.profile.emojis.check : this.profile.emojis.nocheck,
        interaction?.id
      )
      // Whodunnit?
      .addRow(
        "User",
        interaction?.user?.username,
        interaction?.user?.id
      )

    if (interaction) {
      // Permissions Required
      if (this.userPermissions) {
        let member = await interaction.guild?.members.fetch(interaction.user.id)
        Table.addRow(
          "User Permissions",
          this.userPermissions,
          member?.permissions?.has(this.userPermissions[0])
        )
      }
      if (this.botPermissions) {
        let clientMember = interaction.guild.members.me
        Table.addRow(
          "Bot Permissions",
          this.botPermissions,
          clientMember?.permissions?.has(this.botPermissions[0])
        )
      }
    }
    console.log(Table.toString())

    // Options sent at Execution time
    if (coptions && Object.keys(coptions).length > 0) {
      Table = new AsciiTable(
        `/${this.name} : Execute Options`,
        {}
      )
        .setHeading(
          "Option",
          "Value"
        )
      for (let [oName, oVal] of Object.entries(coptions)) {
        Table.addRow(oName, oVal)
      }
      console.log(Table.toString())
    }

    console.log(`/${this.name}: Execute`)

    // If there's no channel defined, try to get it
    if (!this.channel) {
      this.channel = await this.getChannel(client)
    }

    // See if we need to defer reply
    let hasDeferred = await this.handle_deferrment(interaction)

    // Pre-flight checks
    let buildResult = await this.build(client, interaction, coptions)

    // If we set to null because we already did something, ignore the rest
    let doSend = !(this?.null && this.null)
    let sendResult = false

    // If we're still sending, send it
    if (doSend) {
      sendResult = await this.send(
        client,
        interaction,
        this.pages,
        independent,
        hasDeferred
      )
    }

    console.log("")

    return buildResult && sendResult && !this.error
  }

  async test(client, interaction) {
    // If there's no channel defined, try to get it
    if (!this.channel) {
      this.channel = await this.getChannel(client)
    }

    console.log(`/${this.name}: Test`)
    let execResult = false

    // If we've got test options defined
    if (this.testOptions.length > 0) {
      let pages = []
      let i = 0
      let testBook  = !this.testIndependent // One Book
      let testBooks = this.testIndependent  // Many Books

      if (testBook) {
        console.log(`/${this.name}: Test One Book with ${this.testOptions.length} Pages`)
      } else if (testBooks) {
        console.log(`/${this.name}: Test ${this.testOptions.length} Books`)
      }
      // Cycle through test options
      for (let thisTest of this.testOptions) {
        this.testPageNum += 1
        // Reset props
        this.props = {}
        // Reset error
        this.error = false

        // If One Book
        if (testBook) {
          // Build this Page
          let buildResult = await this.build(
            client,
            interaction,
            thisTest
          )
          // Check truth assertion
          if (this.testOptions.hasOwnProperty("assert")) {
            if (buildResult != this.testOptions.assert) {
              this.props["error"] = true
            }
          }

          // Push this Page
          let a_page = {...this.props}
          pages.push(a_page)
          i += 1
        }

        // If Many Books
        if (testBooks) {
          try {
            // Execute the Command
            execResult = await this.execute(
              client,
              interaction,
              thisTest,
              testBooks
            )
          } catch(e) {
            // do nothing
          }
        }
      }

      if (testBook) {
        // If we built a Book, send it
        try {
          execResult = await this.send(
            client,
            interaction,
            pages
          )
        } catch(e) {
          console.log(e)
        }
      }

      this.null = true
    } else {
      // Else, no test options sent, just execute as normal
      execResult = await this.execute(client, interaction)
    }

    console.log(''.padEnd(50, "*"))

    return execResult && !this.error
  }
}

exports.RookCommand = RookCommand
