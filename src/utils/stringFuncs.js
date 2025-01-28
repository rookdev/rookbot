// Add ucfirst() to String
String.prototype.ucfirst = function() {
  return this.charAt(0).toUpperCase() + this.slice(1)
}

// Add codeblock() to String
String.prototype.codeblock = function() {
  return `\`\`\`${this}\`\`\``
}
// Add codeblock() to Number
Number.prototype.codeblock = function() {
  return (this + "").codeblock()
}

// Add inlinecode() to String
String.prototype.inlinecode = function() {
  return `\`${this}\``
}
// Add inlinecode() to Number
Number.prototype.inlinecode = function() {
  return (this + "").inlinecode()
}
