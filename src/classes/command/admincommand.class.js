// @ts-nocheck

// Discord Permission Flags, Formatters: inlineCode
const { PermissionFlagsBits, inlineCode } = require('discord.js')
// Base Rook Command
const { RookCommand } = require('../command/rcommand.class')
const mentionFuncs = require('../../utils/formatters/mentions')
const AsciiTable = require('ascii-table')
const fileFuncs = require('../../utils/fs/fileFuncs')
const dbFuncs = require('../../utils/db/dbFuncs')

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
    this.messages.push(`/${this.name}: Admin Build`)
    if (interaction) {
      // Get list of roles
      // DB
      let dbRes = await dbFuncs.getDB(
        interaction.guild.id,
        "roles"
      )
      this.ROLES = dbRes[0]
      this.messages.push(...dbRes[1])
      // /DB

      if (this.ROLES && this.ROLES.length > 0) {
        // Get Admin roles
        let APPROVED_ROLES = this.ROLES["admin"]
        // Bail if we don't have intended Approved Roles data
        if (!APPROVED_ROLES) {
          this.error = true
          this.props.description = `${this.profile.emojis.fail} Failed to get Approved Roles for ${mentionFuncs.guildMention(interaction.guild.name, interaction.guild.id, { showID: true, oneLine: true })}`
          return false
        }

        // Bail if member doesn't have Approved Roles
        if(!(await interaction.member.roles.cache.some(r=>APPROVED_ROLES.includes(r.name))) ) {
          this.error = true
          this.props.description = this.errors.adminOnly
          this.props.fields = []
          this.props.footer = { text: "" }
          this.props.image = { image: "" }
          return false
        }
      }
    }

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
        `/${this.name}: Admin Build Options`,
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

    return actionResult && !this.error
  }
}

exports.AdminCommand = AdminCommand
