// @ts-nocheck

const shell = require('shelljs')
const fs = require('fs')
let PACKAGE = JSON.parse(fs.readFileSync("./package.json", "utf8"))

console.log("GIT PULL")
console.log("========")

shell.exec("node ./src/res/ci/common/git/pull.js")
console.log()

console.log(`Remember to reset ${PACKAGE.name} by running '/shutdown' in Discord!`)
console.log()
