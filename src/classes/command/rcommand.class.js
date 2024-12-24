// @ts-nocheck

const { MessageFlags } = require('discord.js')
const { Pagination } = require('pagination.djs')
const { RookEmbed } = require('../embed/rembed.class')
const { SlimEmbed } = require('../embed/rslimbed.class')
const AsciiTable = require('ascii-table')
const fs = require('fs')

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

function setValue(input, defvalue) {
  if (!defvalue) {
    defvalue = ""
  }
  return input ? input : defvalue
}

String.prototype.ucfirst = function() {
  return this.charAt(0).toUpperCase() + this.slice(1)
}

class RookCommand {
  constructor(client, comprops={}, props={}) {
    this.name                 = setValue(comprops.name, "unknown")
    this.description          = setValue(comprops.description, (this.name.charAt(0).toUpperCase() + this.name.slice(1)))
    this.options              = setValue(comprops.options, [])
    this.category             = setValue(comprops.category, "unknown")
    this.testOptions          = setValue(comprops.testOptions, [])
    this.testIndependent      = setValue(comprops.testIndependent, false)
    this.channelName          = "bot-console"
    this.access               = setValue(comprops.access, "unset")
    this.permissions          = setValue(comprops.permissions, 0)
    this.botPermissions       = setValue(comprops.botPermissions, this.permissions)
    this.permissionsRequired  = setValue(comprops.permissionsRequired, this.permissions)
    this.errors               = require('../../dbs/errors.json')

    this.profile = client.profile
    this.pages = []

    let client_user = client.user
    this.entities = {
      "bot": {
        id:             client_user.id,
        name:           client_user?.nickname || client_user.displayName || client_user.id,
        avatar:         client_user.displayAvatarURL(),
        username:       client_user.username,
        discriminator:  client_user.discriminator,
        tag:            client_user.tag
      },
      "discord": {
        id:             "0",
        name:           "Discord",
        avatar:         "https://cdn.iconscout.com/icon/free/png-512/free-discord-logo-icon-download-in-svg-png-gif-file-formats--social-media-pack-logos-icons-3073764.png?f=webp&w=256",
        username:       "discord",
        discriminator:  "0",
        tag:            "discord"
      }
    }
    this.players = {
      bot:    {},
      user:   {},
      target: {}
    }

    let PROD = false
    let DEV = true
    if (this.profile?.DEV && this.profile.DEV) {
      PROD = false
      DEV = true
    }
    if (process.env.ENV_ACTIVE === "production") {
      PROD = true
      DEV = false
    }
    if (process.env.ENV_ACTIVE === "development") {
      PROD = false
      DEV = true
    }
    this.DEV = !PROD

    this.props = {...props}
    if (!Object.hasOwn(this.props, "full")) {
      this.props["full"] = true
    }
    if (!Object.hasOwn(this.props, "players")) {
      this.props["players"] = this.players
    }

    this.error = false
    this.ephemeral = false
  }

  async getChannel(client, interaction, channelType) {
    channelType = channelType || this.channelName

    let channelIDs = {}
    let channelID = channelType
    let guild = interaction?.guild || client.guild
    let guildID = guild.id
    let channel = null

    try {
      channelIDs = JSON.parse(
        fs.readFileSync(
          `./src/dbs/${guildID}/channels.json`,
          { encoding: "utf8" }
        )
      )
    } catch(err) {
      console.log(err.stack)
    }

    if (channelIDs) {
      if (Object.keys(channelIDs).includes(channelID)) {
        channelID = channelIDs[channelID]
      }
    }

    if (isNumeric(channelID)) {
      channel = await guild?.channels.cache.find(
        c => c.id === channelID
      )
    } else if (typeof channelID == "string") {
      channel = await guild?.channels.cache.find(
        c => c.name === channelID
      )
    }

    return channel
  }

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
    console.log(`/${this.name}: Rook Build`)

    if (!(this.error)) {
      for (let option of this.options) {
        if ((!(coptions.hasOwnProperty(option.name)))) {
          let thisOption = interaction.options.get(option.name)
          if (thisOption) {
            coptions[option.name] = thisOption.value
          }
        }
      }
    }

    let actionResult = await this.action(client, interaction, coptions)

    return actionResult && !this.error
  }

  async handle_deferrment(interaction) {
    let hasDeferred = interaction?.deferred
    let hasReply    = interaction?.replied
    let canDefer    = typeof interaction?.deferReply === "function"

    // Defer if needed
    if (!hasDeferred && !hasReply && canDefer) {
      let deferMsg = `/${this.name}: Deferring Reply`
      if (this.ephemeral) {
        deferMsg += " [Ephemeral]"
      }
      console.log(deferMsg)
      await interaction.deferReply(
        {
          ephemeral: this.ephemeral
        }
      )
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
      console.log(`/${this.name}: Editing Reply`)
      try {
        if (!isEphemeral) {
          await interaction.editReply(this_package)
        } else {
          console.log(`/${this.name}: Preparing Ephemeral Response`)
          await interaction.editReply(this_package)
        }
        // handle_result = true
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

    if (isEphemeral) {
      // send followup and delete reply
      console.log(`/${this.name}: Sending Ephemeral & Deleting Interaction`)
      await interaction.followUp(this_package)
      await interaction.deleteReply()
      handle_result = true
    }

    return handle_result
  }

  async print_it(client, pages) {
    console.log(`/${this.name}: Print it...`)

    if (!pages || (pages.length == 0)) {
      pages = [ this.props ]
    }

    if (pages) {
      let i = 0
      for (let page of pages) {
        if (page?.ephemeral && page.ephemeral) {
          // console.log(`/${this.name}: Page ${i} is Ephemeral`)
          this.ephemeral = true
        }
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
        let title = page?.caption?.text || page?.title?.text || ""
        msg += `[${title}]`
        console.log(msg)
        i += 1
      }

      return true
    }

    return !this.error
  }

  async ship_it(interaction, independent=false, hasDeferred=false) {
    console.log(`/${this.name}: ...and Ship it!`)

    let this_package = { embeds: this.pages }

    if (this.pages.length > 1) {
      console.log(`/${this.name}: Binding a Book with ${this.pages.length} Pages`)
      let these_pagination = await new Pagination(interaction)
      these_pagination.setEmbeds(
        this.pages,
        (page, index, array) => {
          let footer_text = page.toJSON()?.footer?.text || ""
          if (footer_text && (footer_text != "")) {
            footer_text = " • " + footer_text
          }
          return page.setFooter(
            {
              text: `Page: ${index+1}/${array.length}${footer_text}`
            }
          )
        }
      )
      these_pagination.render()
      this_package = {
        embeds: [ these_pagination ]
      }
    }

    if (this.ephemeral) {
      this_package.flags = MessageFlags.Ephemeral
      this_package.ephemeral = true
    }

    let interaction_result = false
    if (interaction && !independent) {
      interaction_result = await this.handle_interaction(
        interaction,
        this_package,
        hasDeferred
      )
    }

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

    let printResult = await this.print_it(client, pages)
    // if (printResult) { console.log(`/${this.name}: Printed!`) }

    let shipResult = await this.ship_it(
      interaction,
      independent,
      hasDeferred
    )
    // if (shipResult) { console.log(`/${this.name}: Shipped!`) }

    return printResult && shipResult
  }

  async execute(client, interaction, coptions, independent=false) {
    const Table = new AsciiTable(
      `/${this.name}` + " : " + new Date().toISOString(),
      {}
    )
    Table.setHeading(
      "",
      "Name",
      "ID"
    )
    Table.setAlign(2, AsciiTable.RIGHT)
    Table.addRow(
      "Guild",
      interaction?.member?.guild?.name,
      interaction?.guildId
    )
    Table.addRow(
      "Channel",
      await interaction?.guild?.channels?.cache?.find(c => c.id === interaction?.channelId)?.name,
      interaction?.channelId
    )
    Table.addRow(
      "Interaction",
      "",
      interaction.id
    )
    Table.addRow(
      "User",
      interaction?.user?.username,
      interaction?.user?.id
    )
    console.log(Table.toString())

    console.log(`/${this.name}: Execute`)

    if (!this.channel) {
      this.channel = await this.getChannel(client)
    }

    let hasDeferred = await this.handle_deferrment(interaction)

    if (interaction) {
      let caller = await interaction?.guild?.members.cache.find(
        u => u.id === interaction.user.id
      )
      if (caller) {
        this.entities.caller = {
          id:             caller.id,
          name:           caller.nickname || caller.displayName || caller.id,
          avatar:         caller.displayAvatarURL(),
          username:       caller.user.username,
          discriminator:  caller.user.discriminator,
          tag:            caller.user.tag
        }
      }
      if (interaction?.guild) {
        this.entities.guild = {
          id:     interaction.guild.id,
          name:   interaction.guild.name,
          avatar: interaction.guild.iconURL()
        }
      }
    }

    let buildResult = await this.build(client, interaction, coptions)

    let doSend = !(this?.null && this.null)
    let sendResult = false

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
    if (!this.channel) {
      this.channel = await this.getChannel(client)
    }

    console.log(`/${this.name}: Test`)
    let execResult = false

    if (this.testOptions.length > 0) {
      let pages = []
      let i = 0
      let testBook  = !this.testIndependent
      let testBooks = this.testIndependent

      if (testBook) {
        console.log(`/${this.name}: Test One Book with ${this.testOptions.length} Pages`)
      } else if (testBooks) {
        console.log(`/${this.name}: Test ${this.testOptions.length} Books`)
      }
      for (let thisTest of this.testOptions) {
        if (testBook) {
          let buildResult = await this.build(
            client,
            interaction,
            thisTest
          )
          if (this.testOptions.hasOwnProperty("assert")) {
            if (buildResult != this.testOptions.assert) {
              this.props["error"] = true
            }
          }

          let a_page = {...this.props}
          pages.push(a_page)
          i += 1
        }

        if (testBooks) {
          try {
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
      execResult = await this.execute(client, interaction)
    }

    return execResult && !this.error
  }
}

exports.RookCommand = RookCommand
