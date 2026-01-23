const empty = (data) => {
  // Check if data is a number or boolean, and return false as they're never considered empty
  if (typeof data === 'number' || typeof data === 'boolean') {
    return false;
  }
  
  // Check if data is undefined or null, and return true as they're considered empty
  if (typeof data === 'undefined' || data === null) {
    return true;
  }

  // Check if data has a length property (e.g. strings, arrays) and return true if the length is 0
  if (typeof data.length !== 'undefined') {
    return data.length === 0;
  }

  // Check if data is an object and use Object.keys() to determine if it has any enumerable properties
  if (typeof data === 'object') {
    return Object.keys(data).length === 0;
  }

  // Return false for any other data types, as they're not considered empty
  return false;
};

// Set value with a fallback
function setValue(input, defvalue) {
  if (!defvalue) {
    defvalue = ""
  }
  return input ? input : defvalue
}

module.exports = {
  empty,
  setValue
}
