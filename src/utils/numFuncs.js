// Does this resemble a number?
function isNumeric(n) {
  let isaN      = !isNaN(n)
  let isBool    = typeof n === "boolean"
  let isStr     = typeof n === "string"
  let isNumStr  = (
    isStr &&
    ((n.replace(/\D/g, '') + "") == (n + ""))
  )

  return (isaN || isNumStr) && !isBool
}

exports.isNumeric = isNumeric
