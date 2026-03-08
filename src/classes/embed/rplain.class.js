// @ts-nocheck

// Base Rook Slimbed
const { SlimEmbed } = require('../../classes/embed/rslimbed.class')
// Rook Client
const { RookClient } = require('../objects/rclient.class')

/**
 * @class
 * @classdesc Build a Slim Villains-branded Embed
 * @this {RookPlain}
 * @extends {SlimEmbed}
 * @public
 */
class RookPlain extends SlimEmbed {
  // constructor(client: RookClient, props: import('../../types/embed').EmbedProps) {
  constructor(client, props) {
    super(client, props)
  }
}

exports.RookPlain = RookPlain
