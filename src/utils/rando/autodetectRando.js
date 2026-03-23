const fileFuncs = require('../../utils/fs/fileFuncs')

module.exports = async (hashID) => {
  let gameID = null
  let autodetect = false
  let autodetected = false
  let messages = []
  let permalink = ""

  if (
    hashID != "" &&
    (
      (hashID.indexOf("http://") > -1) ||
      (hashID.indexOf("https://") > -1) ||
      (
        hashID.indexOf("/") > -1
      )
    )
  ) {
    if (
      (hashID.indexOf("http://") == -1) &&
      (hashID.indexOf("https://") == -1)
    ) {
      hashID = `https://${hashID}`
    }
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
          let thisPattern = pattern.replace("<hash>","").replace("%3Chash%3E","")
          if (thisPattern.endsWith("//")) {
            thisPattern = thisPattern.substring(0, thisPattern.length - 2)
          }
          // console.log(
          //   {
          //     pattern: new URL(pattern),
          //     check: new URL(thisPattern),
          //     hash: new URL(hashID)
          //   }
          // )
          if (hashID.includes(thisPattern)) {
            permalink = hashID
            let filenameParts = filename.split("\\")
            if (filenameParts.length < 2) {
              filenameParts = filename.split("/")
            }
            gameID = filenameParts[filenameParts.length - 1]
            gameID = gameID.substring(0, gameID.indexOf("."))
            // messages.push(filename,randoData.rando.permalink,thisPattern,gameID)
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
    messages.push("Failed Autodetect!")
  } else if (autodetect && autodetected) {
    // succeeded autodetect
    messages.push("Succeeded Autodetect!")
    // messages.push(hashID,gameID)
  } else {
    // received explicit reference
    messages.push("Got Explicit Reference!")
  }
  // console.log(messages.join("\n"))
  
  return [gameID, hashID, permalink]
}
