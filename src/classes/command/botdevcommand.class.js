// @ts-nocheck

// Discord Permission Flags
const { PermissionFlagsBits } = require('discord.js')
// Admin Command
const { AdminCommand } = require('../command/admincommand.class')
const fileFuncs = require('../../utils/fs/fileFuncs')
const dbFuncs = require('../../utils/db/dbFuncs')

/**
 * @class
 * @classdesc Build a Command for BotDevs-only
 * @this {BotDevCommand}
 * @extends {AdminCommand}
 * @public
 */
class BotDevCommand extends AdminCommand {
  constructor(client, comprops, props) {
    // BotPerms: Administrator
    comprops.permissions = [ PermissionFlagsBits.Administrator ]
    // Category: BotDev
    comprops.access = comprops?.access ? comprops.access : "BotDev"
    comprops.wide = comprops?.wide ? comprops.wide : true

    // Create parent object
    super(
      client,
      {...comprops},
      {...props}
    )

    // Disable sources for AdminCommand and children
    // FIXME: NYI
    for (let source of ["user", "search"]) {
      if (!(this.flags)) {
        this.flags = {}
      }
      if ((!(source in this.flags)) || (this.flags[source] != "unapplicable")) {
        this.flags[source] = "invalid"
      }
    }
    // Get botdev-defined list of roles groupings
    /**
     * List of roles as provided by server profile database file
     * @type {Object.<[x:string], Array.<string>>}
     * @public
     */
    this.ROLES = {} // populate in build()
  }

  // declare props: import('../../types/embed').EmbedProps

  // Build the response
  async build(client, interaction, coptions={}) {
    let messages = []
    messages.push(`/${this.name}: BotDev Build`)
    if (interaction) {
      // Get list of roles
      // DB
      let dbRes = await dbFuncs.getDB(
        interaction.guild.id,
        "roles"
      )
      this.ROLES = dbRes[0]
      let newMessages = dbRes[1]
      messages = messages.concat(newMessages)
      // /DB

      if (this.ROLES && this.ROLES.length > 0) {
        // Get BotDev roles
        let APPROVED_ROLES = this.ROLES["admin"].concat(this.ROLES["botdev"])
        // Bail if we don't have intended Approved Roles data
        if (!APPROVED_ROLES) {
          this.error = true
          this.props.description = `${this.profile.emojis.fail} Failed to get Approved Roles for *${interaction.guild.name}* [${inlineCode(interaction.guild.id)}]`
          return !this.error
        }

        // Bail if member doesn't have Approved Roles
        if(!(await interaction.member.roles.cache.some(r=>APPROVED_ROLES.includes(r.name))) ) {
          this.error = true
          this.props.description = this.errors.adminOnly
          this.props.fields = []
          this.props.footer = { text: "" }
          this.props.image = { image: "" }
          return !this.error
        }
      }
    }

    // Process canned option values into sent option values
    if (!(this.error)) {
      for (let option of this.options) {
        if ((!(coptions.hasOwnProperty(option.name)))) {
          let thisOption = interaction?.options.get(option.name)
          if (thisOption) {
            coptions[option.name] = thisOption.value
          }
        }
      }
    }

    console.log(messages.join("\n"))

    // Run the action
    let actionResult = await this.action(client, interaction, coptions)

    return actionResult && !this.error
  }
}

exports.BotDevCommand = BotDevCommand
