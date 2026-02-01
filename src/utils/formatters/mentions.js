const { inlineCode, italic } = require('discord.js')

/*

Options:
hideTxt:  Hide text
oneLine:  One line
showID:   Show item ID
textOnly: Suitable for plaintext

*/

function mention(tID, targetType, opts={}) {
  let ret = ""

  // Not Text-only
  if (!opts.textOnly && !opts.hideText) {
    switch(targetType) {
      case "channel":
        ret = `#${tID}`
        break
      case "role":
        ret = `@&${tID}`
        break
      case "user":
        ret = `@${tID}`
        break
      default:
        ret = tID
        break
    }
    if (
      [
        "channel",
        "emoji",
        "role",
        "user"
      ].includes(targetType)
    ) {
      ret = `<${ret}>`
    }

    // As code
    if (opts.asCode) {
      ret = inlineCode(ret)
    }
  }

  if (opts.showID) {
    if (!opts.hideText) {
      ret += " "
    }
    if (!opts.oneLine) {
      ret += "\n"
    }
    if (opts.textOnly) {
      ret += `(ID: ${tID})`
    } else {
      ret += inlineCode(`[${tID}]`)
    }
  }

  return ret
}
function channelMention(cID, opts={}) {
  return mention(cID, "channel", opts)
}
function emojiMention(eName, eID, opts={}) {
  return mention(`:${eName}:${eID}`, "emoji", opts)
}
function guildMention(gName, gID, opts={}) {
  let ret = ""

  if (!opts.hideText) {
    ret += italic(gName)
  }

  if (opts.showID) {
    if (!opts.hideText) {
      ret += " "
    }
    if (!opts.oneLine) {
      ret += "\n"
    }
    if (opts.textOnly) {
      ret += `[${gID}]`
    } else {
      ret += inlineCode(`[${gID}]`)
    }
  }

  return ret
}
function messageMention(tID, opts={}) {
  let guildID = 0
  let chanID = 0
  let msgID = 0
  if (typeof tID === "object") {
    guildID = tID.guildId
    chanID = tID.channelId
    msgID = tID.messageId
  } else if (typeof tID == "string") {
    let matches = tID.match(/^(?:[\D]+)([\d]+)(?:[/])([\d]+)(?:[/])([\d]+)(?:[/]?)$/)
    guildID = matches[1]
    chanID = matches[2]
    msgID = matches[3]
  }

  let messageURL = `https://discord.com/channels/` + `${guildID}/${chanID}/${msgID}`
  ret = messageURL

  if (opts.showID) {
    if (!opts.oneLine) {
      ret += "\n"
    }
    ret += inlineCode(`[${msgID}]`)
  }

  return ret
}
function roleMention(rID, opts={}) {
  return mention(rID, "role", opts)
}
function userMention(uID, opts={}) {
  return mention(uID, "user", opts)
}

module.exports = {
  channelMention, // passthrough
  emojiMention,   // passthrough
  guildMention,   // override
  messageMention, // override
  roleMention,    // passthrough
  userMention     // passthrough
}
