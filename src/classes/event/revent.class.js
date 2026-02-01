// @ts-nocheck

const fileFuncs = require('../../utils/fs/fileFuncs')
const getters = require('../../utils/guild/getters')

/**
 * @class
 * @classdesc Create a Rook-branded Event
 * @this {RookEvent}
 * @public
 */
class RookEvent {
  constructor(
    args={},
    options={}
  ) {
    this.messages = []
  }
}

exports.RookEvent = RookEvent
