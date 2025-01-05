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
