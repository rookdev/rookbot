const { RookEmbed } = require('../../classes/embed/rembed.class')

/**
 * @class
 * @classdesc Build a Slim Villains-branded Embed
 * @this {SlimEmbed}
 * @extends {RookEmbed}
 * @public
 */
class SlimEmbed extends RookEmbed {
  /**
   * @typedef {Object} EmbedField
   * @property {string} name Field Name
   * @property {string} value Field Value
   * @property {boolean} inline Inline?
   */
  /**
   * @typedef {Object} Player Player
   * @property {string} name The name
   * @property {string} url The URL
   * @property {string} avatar The Avatar
   */
  /**
   * @typedef {Object} EmbedProps Embed Properties
   * @property {boolean}                      full                    Print Full Embed
   * @property {string}                       color                   Stripe color
   * @property {{text: string}}               caption                 Caption text
   * @property {{text: string, url: string}}  title                   Title text & url
   * @property {string}                       thumbnail               Thumbnail url
   * @property {string}                       description             Body text
   * @property {Array.<EmbedField>}           fields                  Embed Fields
   * @property {string}                       image                   Body Image
   * @property {{msg: string, image: string}} footer                  Footer text & image
   * @property {number | boolean}             timestamp               Timestamp for footer
   * @property {boolean}                      error                   Print error format
   * @property {{bot: Player, user: Player, target: Player}} players  Players
   */

  /**
   * Constructor
   * @param {(EmbedProps | Object.<any>)} props Local list of command properties
   */
  constructor(client, props = {}) {
    // If we've got no title, set default
    if(props?.title?.text && props.title.text.trim() != "" && props.title.text.trim() != "<NONE>") {
      if(!(props?.description)) {
        props.description = ""
      }
      // If the description is an array, join it with newlines
      if(Array.isArray(props.description)) {
        props.description = props.description.join("\n")
      }
      props.description = `***${props.title.text}***\n${props.description}`
    }
    props.title     = { text: "<NONE>" }
    props.thumbnail = "<NONE>"
    props.footer    = { msg: "<NONE>" }
    props.timestamp = false

    super(client, props)
  }
}

exports.SlimEmbed = SlimEmbed
