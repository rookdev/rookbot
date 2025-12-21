// Formatters: bold, italic, underlineString
const {
  bold,
  italic,
  underline
} = require('discord.js')

// Add ucfirst() to String
String.prototype.ucfirst = function() {
  return this.charAt(0).toUpperCase() + this.slice(1)
}

// Add boldItalic() to String
String.prototype.boldItalic = function() {
  return bold(italic(this))
}

// Add boldUnderline() to String
String.prototype.boldUnderline = function() {
  return bold(underline(this))
}

// Add pluralize() to string
String.prototype.pluralize = function(count = 2) {
  let singular = this
  let plural = ""
  if (singular.endsWith("s")) {
    plural = this.substring(0, this.length - 2) + 'i'
  } else if (singular.endsWith("y")) {
    plural = this.substring(0, this.length - 1) + "ies"
  } else {
    plural = singular + 's'
  }
  return count == 1 ? singular : plural
}
