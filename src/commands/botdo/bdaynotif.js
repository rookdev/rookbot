// @ts-nocheck
// Command Option Types, Permission Flags, Formatters: inlineCode, italic
const { ApplicationCommandOptionType, PermissionFlagsBits, inlineCode, italic  } = require('discord.js')
// Print Birthday Notifications
const { birthdayNotif } = require('../../utils/guild/birthdayNotif')
// Base Rook Command
const { RookCommand } = require('../../classes/command/rcommand.class')
const mentionFuncs = require('../../utils/formatters/mentions')
const globalFuncs = require('../../utils/primitives/globalFuncs')
const getters = require('../../utils/guild/getters')
const moment = require('moment')

module.exports = class BirthdayNotifCommand extends RookCommand {
  constructor(client, comprops, props) {
    comprops = comprops || {
      name: "bdaynotif",
      category: "botdo",
      description: "Post birthday notification",
      userPermissions: [ PermissionFlagsBits.ViewChannel ],
      botPermissions: [ PermissionFlagsBits.ViewChannel ]
    }
    props = props || {}
    super(
      client,
      {...comprops},
      {...props}
    )
  }

  // declare props: import('../../types/embed').EmbedProps

  async action(client, interaction, coptions={}) {
    // Get Guild ID
    const interactionGuild = await this.getGuild(client, interaction)
    const guildID = interactionGuild.id

    // Set EmbedPlayerTypes to Caller|Target
    this.props.playerTypes = {
      user: "caller",
      target: "target"
    }

    // Call the utility function to change the nickname
    const result = await birthdayNotif(client, interactionGuild)

    if (result?.success) {
      this.messages.push(result.message)
      this.messages.push(result?.bdays ? JSON.stringify(result.bdays) : null)
      if (result?.bdays) {
        this.props.description = []
        // Cycle through months
        for (let [bdMonth, bdDays] of Object.entries(result.bdays)) {
          if (!bdMonth.contains("#")) {
            // Cycle through days
            for (let [bdDay, bdUsers] of Object.entries(bdDays)) {
              // Cycle through users
              for (let [bdUserID, bduNote] of Object.entries(bdUsers)) {
                // Get User from This Guild
                let guildMember = await getters.getCachedMember(client, interactionGuild, bdUserID)
                let sendDate = {months: bdMonth-1, date: bdDay}
                this.messages.push("ThisSend:  " + JSON.stringify(sendDate))
                let thisYear = moment(sendDate)
                let momentFormat = "dd MMM DD, YYYY"
                if (thisYear) {
                  this.messages.push(
                    "This Year: " +
                    JSON.stringify(thisYear.toObject()) + ':' +
                    thisYear.format(momentFormat)
                  )
                }
                let nextSend = {...sendDate, years: thisYear.toObject().years + 1}
                this.messages.push("NextSend:  " + JSON.stringify(sendDate))
                let nextYear = moment(nextSend)
                if (nextYear) {
                  this.messages.push(
                    "Next Year: " +
                    JSON.stringify(nextYear.toObject()) + ':' +
                    nextYear.format(momentFormat)
                  )
                }
                let thisNotif = inlineCode(thisYear.format("MM") + '/' + thisYear.format("DD") + ':')
                thisNotif += mentionFuncs.userMention(bdUserID)
                thisNotif += " ("
                if (thisYear) {
                  thisNotif += thisYear.fromNow()
                  if (thisYear.unix() < moment().unix()) {
                    thisNotif += ", "
                    thisNotif += nextYear.fromNow()
                  }
                }
                thisNotif += ")"
                this.props.description.push(thisNotif)
              }
            }
          }
        }
      }
    } else {
      this.error = true
      this.props.description = result?.message
      return false
    }

    return !this.error
  }
}
