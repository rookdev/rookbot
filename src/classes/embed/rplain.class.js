// @ts-nocheck

const { SlimEmbed } = require('../embed/rslimbed.class')
// Rook Client
const { RookClient } = require('../objects/rclient.class')

/**
 * @class
 * @classdesc Build a Plain Rook-branded Embed
 * @this {RookPlain}
 * @extends {SlimEmbed}
 * @public
 */
class RookPlain extends SlimEmbed {
  // constructor(client: RookClient, props: import('../../types/embed').EmbedProps) {
  constructor(client, props) {
    if (!props?.description) {
      props.description = []
    } else if (typeof props.description === "string") {
      props.description = [ props.description ]
    }

    if (props.fields) {
      let plainFields = []
      for (let fieldRow of props.fields) {
        let rowTitles = []
        let rowValues = []
        for (let field of fieldRow) {
          if (field.value) {
            rowTitles.push(field.name)
            rowValues.push(field.value)
          }
        }
        if (rowTitles.length) {
          plainFields.push("|" + rowTitles.join("|"))
          plainFields.push("|-".repeat(rowTitles.length))
          plainFields.push("|" + rowValues.join("|"))
          plainFields.push("")
        }
      }
      props.description.push(...plainFields)
    }
    delete props.fields

    if (props?.image?.image) {
      props.description.push(`![](${props.image.image})`)
    }

    if (props?.footer) {
      props.description.push("---")
      if (props?.footer?.text) {
        props.description.push(`###### ${props.footer.text}`)
      }
    }
    delete props.footer

    super(client, props)

    if (!this?.attachments) {
      this.attachments = []
    }
  }
}

exports.RookPlain = RookPlain
