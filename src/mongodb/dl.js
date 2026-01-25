const fileFuncs = require('../utils/fs/fileFuncs')
const shell = require('shelljs')
const fs = require('fs')

async function run() {
  let mongodb_compare = null
  try {
    let mode = "compare"
    mongodb_compare = shell.exec(
      `node ./src/mongodb/crun.js -m ${mode}`,
      { silent: true }
    )
    mongodb_compare = mongodb_compare.stdout.trim()
  } catch (err) {
    console.log(err.stack)
  }

  let src = fileFuncs.getAPath(
    [
      "src",
      "mongodb",
      "output",
      "diffdb"
    ]
  )
  if (fs.existsSync(src)) {
    console.log(mongodb_compare)
    let dest = fileFuncs.getAPath(
      [
        "src",
        "dbs"
      ]
    )

    for (filePath of fs.globSync("**/*.db.json")) {
      fs.rmSync(filePath)
    }
    fs.cpSync(
      src,
      dest,
      { recursive: true }
    )
  } else {
    console.log("No new files.")
  }
}

console.log("")
console.log("---")
console.log("MongoDB Download:")

run().catch(console.dir);
