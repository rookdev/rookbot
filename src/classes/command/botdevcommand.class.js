// @ts-nocheck
// Discord Permission Flags
const { PermissionFlagsBits } = require('discord.js')
// Admin Command
const { AdminCommand } = require('../command/admincommand.class')
// Filesystem manipulation
const fs = require('fs')

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

    // Create parent object
    super(
      client,
      {...comprops},
      {...props}
    )

    // Disable sources for AdminCommand and children
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
    console.log(`/${this.name}: BotDev Build`)
    if (interaction) {
      // Get list of roles
      this.ROLES = JSON.parse(fs.readFileSync(`./src/dbs/${interaction.guild.id}/roles.json`, "utf8"))
      // Get BotDev roles
      let APPROVED_ROLES = this.ROLES["admin"].concat(this.ROLES["botdev"])
      // Bail if we don't have intended Approved Roles data
      if (!APPROVED_ROLES) {
        this.error = true
        this.props.description = "Failed to get Approved Roles."
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
}

exports.BotDevCommand = BotDevCommand
