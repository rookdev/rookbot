// @ts-nocheck

const { Invite, InviteType } = require('discord.js')
// Rook-branded Client
const { RookClient } = require('../../classes/objects/rclient.class')
// Rook-branded Embed

/**
 * Logs edited messages from the server.
 * @param {RookClient} client
 * @param {Invite} invite
 */
module.exports = async (client, invite) => {
  let result = null
  let messages = []

  messages.push(
    JSON.stringify(
      [
        {
          name: "Channel",
          value: invite.channelId
        },
        {
          name: "Code",
          value: invite.code
        },
        {
          name: "Created At",
          value: invite.createdAt
        },
        {
          name: "Expires At",
          value: invite.expiresAt
        },
        {
          name: "Guild",
          value: invite?.guild?.name
        },
        {
          name: "Inviter",
          value: invite.inviterId
        },
        {
          name: "Max Age",
          value: invite?.maxAge
        },
        {
          name: "Max Uses",
          value: invite?.maxUses
        },
        {
          name: "Member Count",
          value: invite?.memberCount
        },
        {
          name: "Presence Count",
          value: invite?.presenceCount
        },
        {
          name: "Temp Membership",
          value: invite?.temporary
        },
        {
          name: "Invite Type",
          value: InviteType[invite.type]
        },
        {
          name: "Invite URL",
          value: invite.url
        },
        {
          name: "Uses",
          value: invite?.uses
        }
      ]
    )
  )

  return [result, messages]
}
