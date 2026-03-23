// @ts-nocheck

// Base Rook Embed
const { RookEmbed } = require('../../classes/embed/rembed.class')
// Rook Client
const { RookClient } = require('../objects/rclient.class')

/**
 * @class
 * @classdesc Build a Slim Rook-branded Embed
 * @this {SlimEmbed}
 * @extends {RookEmbed}
 * @public
 */
class SlimEmbed extends RookEmbed {
  // constructor(client: RookClient, props: import('../../types/embed').EmbedProps) {
  constructor(client, props) {
    // If we've got no title, set default
    if(props?.title?.text && props.title.text.trim() != "" && props.title.text.trim() != "<NONE>") {
      if(!(props?.description)) {
        props.description = ""
      }
      // If the description is an array, join it with newlines
      if(Array.isArray(props.description)) {
        props.description = props.description.join("\n")
      }
      props.description = [
        props.title.text.boldItalic(),
        props.description
      ]
    }
    props.title     = { text:   "<NONE>" }
    props.thumbnail = { image:  "<NONE>" }
    props.footer    = { text:   "<NONE>" }
    props.timestamp = false

    super(client, props)
  }
}

exports.SlimEmbed = SlimEmbed
