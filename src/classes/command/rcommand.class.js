// @ts-nocheck

const { MessageFlags, codeBlock, italic } = require('discord.js')            // Message Flags
const { RookMessage } = require('../objects/rmessage.class')
const { Pagination } = require('pagination.djs')          // Pagination
const { RookEmbed } = require('../embed/rembed.class')    // Rook Embed
const { RookPlain } = require('../embed/rplain.class')
const { SlimEmbed } = require('../embed/rslimbed.class')  // Rook Slim Embed
// Pretty-print to console
const AsciiTable = require('ascii-table')
const fileFuncs = require('../../utils/fs/fileFuncs')

const { setValue } = require("../../utils/primitives/globalFuncs")
const mentionFuncs = require('../../utils/formatters/mentions')
const stringFuncs = require("../../utils/primitives/stringFuncs")
const numFuncs = require("../../utils/primitives/numFuncs")
const dbFuncs = require('../../utils/db/dbFuncs')
const getters = require('../../utils/guild/getters')
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
    this.messages         = []
    this.platforms        = setValue(comprops.platforms, ["discord"])
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
        this.messages.push(msg)
      }
      return false
    }

    let guild = await this.getGuild(client, member)
    if (!guild) {
      if (!silent) {
        this.error = true
        this.props.playerTypes = {
          user: "bot",
          target: "target"
        }
        msg = `${this.profile.emojis.fail} No guild found for ${member}.`
        this.props.description = msg
        this.messages.push(msg)
      }
      return false
    }

    if (client.user.id === member.id) {
      return true
    }

    if (member.id === guild.ownerId) {
      if (!silent) {
        this.error = true
        this.props.playerTypes = {
          user: "bot",
          target: "target"
        }
        msg = [
          `${this.profile.emojis.fail} Bot can't manage user.`,
          `${this.profile.emojis.fail} ${member} is Owner of ${mentionFuncs.guildMention(guild.name, guild.id, { showID: true, oneLine: true })}.`
        ]
        this.props.description = msg
      }
      return false
    }

    let clientMember = guild.members.me
    if (!clientMember) {
      if (!silent) {
        this.error = true
        this.props.playerTypes = {
          user: "bot",
          target: "bot"
        }
        msg = `${this.profile.emojis.fail} Bot not found in ${mentionFuncs.guildMention(guild.name, guild.id, { showID: true, oneLine: true })}.`
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

  async getCache(client, parent, cacheType, cacheTest) {
    // getCache(client, guild,   "channels", ["bot-testing"])
    // getCache(client, guild,   "channels", ["<channel_id>"])
    // getCache(client, guild,   "emojis",   ["<emoji_id>"])
    // getCache(client, guild,   "members",  ["<member_id>"])
    // getCache(client, guild,   "roles",    ["Admin"])
    // getCache(client, guild,   "roles",    ["<role_id>"])
    // getCache(client, member,  "roles",    ["Admin"])
    // getCache(client, member,  "roles":    ["<role_id>"])

    return await getters.getCache(client, parent, cacheType, cacheTest)
  }

  async getChannel(client, interaction, channelTypes) {
    console.log(`Get ${channelTypes} of guild`)
    let guild = await this.getGuild(client, interaction)
    // console.log(`Get ${channelTypes} of ${guild.name}`)
    return await this.getCache(
      client,
      guild,
      "channels",
      channelTypes
    )
  }

  async getProp(client, parent, propName) {
    return await getters.getProp(client, parent, propName)
  }

  async getGuild(client, parent) {
    return await getters.getGuild(client, parent)
  }

  async action(client, interaction, coptions) {
    this.messages.push(`/${this.name}: Rook Action`)

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
    this.messages.push(buildMsg)

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
        `/${this.name}: Rook Build Options`,
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
      this.messages.push(Table.toString())
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

  async print_it(client, interaction, pages) {
    this.messages.push(`/${this.name}: Print it... DEPRECATED`)

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
          avatar: await client.user.displayAvatarURL({ size: 128 }),
          tag:    client.user.tag
        }

        let guild = await this.getGuild(client, interaction)
        // If we've got an Interaction
        if (interaction?.id) {
          // Get Guild version of Client User
          let clientMember = guild?.members.me
          // Get Guild version of Caller
          let callerMember = await interaction?.member

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
              page.entities.caller.avatar = await interaction.user.displayAvatarURL({ size: 128 })
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
              page.entities.callerMember.avatar = await callerMember.displayAvatarURL({ size: 128 })
            }
          }

          // If there's no Guild Entity set yet
          //  Set it
          if ((!page.entities?.guild) && (guild)) {
            page.entities.guild = {
              type:   "guild",
              id:     guild?.id,
              name:   guild?.name,
              url:    "http://example.com/guild",
              avatar: await guild?.iconURL({ size: 128 })
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
          // this.messages.push(`/${this.name}: Page ${i} is Ephemeral`)
          this.ephemeral = true
        }

        // Build Printing message
        let msg = `/${this.name}: Printing `
        if (page?.full && !page.full) {
          msg += "slimbed "
          this.pages[i] = await new SlimEmbed(client, page)
        } else if (page?.plain && page.plain) {
          msg += "plain   "
          this.pages[i] = await new RookPlain(client, page)
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

  async send(client, interaction, pages, independent=false, hasDeferred=false) {
    this.messages.push(`/${this.name}: Full Send it!`)
    let rmessage = await new RookMessage(
      client,
      interaction,
      {
        channelName: this.channel?.id,
        pages: pages
      }
    )
    let sendResult = await rmessage.execute()
    return sendResult

    // Print it!
    let printResult = await this.print_it(client, interaction, pages)
    // if (printResult) { this.messages.push(`/${this.name}: Printed!`) }

    // Ship it!
    let shipResult = await this.ship_it(
      interaction,
      independent,
      hasDeferred
    )
    // if (shipResult) { this.messages.push(`/${this.name}: Shipped!`) }

    return printResult && shipResult
  }

  async printMessages() {
    this.messages = this.messages.filter(item=>item !== "")
    if (this.messages.length) {
      console.log(this.messages.join("\n"))
    }
  }

  async execute(client, interaction, coptions, independent=false) {
    if (interaction) {
      if (typeof interaction.deferReply === "function") {
        let intOptions = {}
        if (this.ephemeral) {
          intOptions = { flags: MessageFlags.Ephemeral }
        }
        if (interaction?.id && interaction.id != 0) {
          if (interaction.hasOwnProperty("deferred") && !interaction.deferred) {
            await interaction.deferReply(intOptions)
          }
        }
      }
    }
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
    this.messages.push(dateTable.toString())

    let guild = await this.getGuild(client, interaction)

    let Table = new AsciiTable("", {})
      .setHeading(
        "",
        "Name",
        "ID"
      )
      .setAlign(2, AsciiTable.RIGHT)
      .setBorder('|','-','•','•')
      // Platform it was on
      .addRow(
        "Platform",
        client.platform.ucfirst() + " " + client.profile.emojis[client.platform]
      )
      // Platforms it's implemented for
      .addRow(
        "Platforms",
        this.platforms.map(p => p.ucfirst()).join(", ")
      )
      // Guild it was in
      .addRow(
        "Guild",
        guild?.name,
        guild?.id
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
        interaction?.id ? this.profile.emojis.check : this.profile.emojis.nocheck,
        interaction?.id
      )
      // Whodunnit?
      .addRow(
        "User",
        interaction?.user?.username,
        interaction?.user?.id
      )

    if (["stoat"].includes(client.platform)) {
      // console.log(interaction)
    }

    if (
      interaction &&
      !(coptions?.bypass)
    ) {
      // Permissions Required
      if (this.userPermissions) {
        let member = await this.getCache(
          client,
          guild,
          "members",
          interaction?.user?.id ?? interaction.authorId
        )
        let userHasPermission = false
        if ([
          "stoat"
        ].includes(client.platform)) {
          userHasPermission = member?.hasPermission(this.userPermissions[0])
        } else {
          userHasPermission = member?.permissions?.has(this.userPermissions[0])
        }
        Table.addRow(
          "User Permissions",
          this.userPermissions,
          userHasPermission
        )
      }
      if (this.botPermissions) {
        let clientMember = guild?.members.me
        let botHasPermission = false
        if ([
          "stoat"
        ].includes(client.platform)) {
          botHasPermission = clientMember?.hasPermission(this.botPermissions[0])
        } else {
          botHasPermission = clientMember?.permissions?.has(this.botPermissions[0])
        }
        Table.addRow(
          "Bot Permissions",
          this.botPermissions,
          clientMember?.permissions?.has(this.botPermissions[0])
        )
      }
    }
    this.messages.push(Table.toString())

    // Options sent at Execution time
    if (coptions && Object.keys(coptions).length > 0) {
      Table = new AsciiTable(
        `/${this.name}: Rook Execute Options`,
        {}
      )
        .setHeading(
          "Option",
          "Value"
        )
      for (let [oName, oVal] of Object.entries(coptions)) {
        Table.addRow(oName, oVal)
      }
      this.messages.push(Table.toString())
    }

    this.messages.push(`/${this.name}: Rook Execute`)

    // If there's no channel defined, try to get it
    if (!this.channel) {
      if (interaction && interaction?.channel) {
        this.channel = interaction.channel
      } else {
        this.channel = await this.getChannel(client, client, this.channelName)
      }
    }

    // Pre-flight checks
    let buildResult = await this.build(client, interaction, coptions)

    // If we set to null because we already did something, ignore the rest
    let doSend = !(this?.null && this.null)
    let sendResult = false

    // If we're still sending, send it
    if (doSend) {
      if (!this.pages.length) {
        this.pages = [ this.props ]
      }
      let rmessage = await new RookMessage(
        client,
        interaction,
        {
          channelName: this.channel?.id,
          pages: this.pages
        }
      )
      let rexec = await rmessage.execute()
      sendResult = rexec
    }

    this.messages.push("")

    this.printMessages()

    return buildResult && sendResult && !this.error
  }

  async test(client, interaction) {
    // If there's no channel defined, try to get it
    if (!this.channel) {
      this.channel = await this.getChannel(client, interaction, this.channelName)
    }

    this.messages.push(`/${this.name}: Rook Test`)
    let execResult = false

    // If we've got test options defined
    if (this.testOptions.length > 0) {
      let pages = []
      let i = 0
      let testBook  = !this.testIndependent // One Book
      let testBooks = this.testIndependent  // Many Books

      if (testBook) {
        this.messages.push(`/${this.name}: Test One Book with ${this.testOptions.length} Pages`)
      } else if (testBooks) {
        this.messages.push(`/${this.name}: Test ${this.testOptions.length} Books`)
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
          let rmessage = await new RookMessage(
            client,
            interaction,
            {
              pages: pages
            }
          )
          execResult = await rmessage.execute()
        } catch(e) {
          this.messages.push(e)
        }
      }

      this.null = true
    } else {
      // Else, no test options sent, just execute as normal
      execResult = await this.execute(client, interaction)
    }

    this.messages.push(''.padEnd(50, "*"))

    this.printMessages()

    return execResult && !this.error
  }
}

exports.RookCommand = RookCommand
