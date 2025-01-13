// @ts-nocheck

const { MessageReaction, User } = require('discord.js')
// Rook-branded Client
const { RookClient } = require('../../classes/objects/rclient.class')
// Rook-branded Embed

const manageRoles = require('../../utils/guild/manageRoles')

/**
 * Logs edited messages from the server.
 * @param {RookClient} client
 * @param {MessageReaction} reaction
 * @param {User} user
 */
module.exports = async (client, reaction, user) => {
  let [result, messages] = await manageRoles(client, reaction, user, "remove")

  return [result, messages]
}
