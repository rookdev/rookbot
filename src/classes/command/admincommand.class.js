const { PermissionFlagsBits } = require('discord.js')
const { RookCommand } = require('../command/rcommand.class')
const fs = require('fs')

/**
 * @class
 * @classdesc Build a Command for Admins-only
 * @this {AdminCommand}
 * @extends {RookCommand}
 * @public
 */
class AdminCommand extends RookCommand {
  constructor(client, comprops, props) {
    // BotPerms: Administrator
    comprops.permissions = [ PermissionFlagsBits.Administrator ]
    // Category: Admin
    comprops.access = comprops?.access ? comprops.access : "Admin"

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

  // Build the response
  async build(client, interaction, coptions={}) {
    console.log(`/${this.name}: Admin Build`)
    if (interaction) {
      // Get list of roles
      this.ROLES = JSON.parse(fs.readFileSync(`./src/dbs/${interaction.guild.id}/roles.json`, "utf8"))
      // Get Admin roles
      let APPROVED_ROLES = this.ROLES["admin"]
      // Bail if we don't have intended Approved Roles data
      if (!APPROVED_ROLES) {
        this.error = true
        this.props.description = "Failed to get Approved Roles."
        return
      }

      // Bail if member doesn't have Approved Roles
      if(!(await interaction.member.roles.cache.some(r=>APPROVED_ROLES.includes(r.name))) ) {
        this.error = true
        this.props.description = this.errors.adminOnly
        this.props.fields = []
        this.props.footer = {}
        this.props.image = ""
        return
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

exports.AdminCommand = AdminCommand
