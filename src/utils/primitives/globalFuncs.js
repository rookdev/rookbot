// Set value with a fallback
function setValue(input, defvalue) {
  if (!defvalue) {
    defvalue = ""
  }
  return input ? input : defvalue
}

exports.setValue = setValue
