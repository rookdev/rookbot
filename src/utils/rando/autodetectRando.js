const fileFuncs = require('../../utils/fs/fileFuncs')

module.exports = async (hashID) => {
  let gameID = null
  let autodetect = false
  let autodetected = false

  if (
    hashID != "" &&
    (
      hashID.includes("http://") ||
      hashID.includes("https://")
    )
  ) {
    autodetect = true
    for (let filename of fileFuncs.getAllFiles(
      [
        "src",
        "dbs",
        "randos"
      ]
    )) {
      let randoData = fileFuncs.getAFile(
        // [
        //   "src",
        //   "dbs",
        //   "randos"
        // ],
        filename
      )
      if (randoData?.rando?.permalink) {
        if (typeof randoData.rando.permalink == "string") {
          randoData.rando.permalink = [randoData.rando.permalink]
        }
        for (let pattern of randoData.rando.permalink) {
          let thisPattern = pattern.replace("<hash>","")
          if (thisPattern.endsWith("//")) {
            thisPattern = thisPattern.substring(0, thisPattern.length - 2)
          }
          if (hashID.includes(thisPattern)) {
            let filenameParts = filename.split("\\")
            if (filenameParts.length < 2) {
              filenameParts = filename.split("/")
            }
            gameID = filenameParts[filenameParts.length - 1]
            gameID = gameID.substring(0, gameID.indexOf("."))
            // console.log(filename,randoData.rando.permalink,thisPattern,gameID)
            autodetected = true
            break
          }
        }
      }
    }
  }

  if (hashID.includes("http://") || hashID.includes("https://")) {
    if (hashID.endsWith("/")) {
      hashID = hashID.substring(0, hashID.length - 1)
    }
    hashID = hashID.split("/")
    hashID = hashID[hashID.length - 1]
  }

  if (autodetect && !autodetected) {
    // failed autodetect
    console.log("Failed Autodetect!")
  } else if (autodetect && autodetected) {
    // succeeded autodetect
    console.log("Succeeded Autodetect!")
    // console.log(hashID,gameID)
  } else {
    // received explicit reference
    console.log("Got Explicit Reference!")
  }
  
  return [gameID, hashID]
}
