// @ts-check
// Standalone git pull
const PACKAGE = require('./package.json') // Node Package data
const shell = require('shelljs')          // Run shell commands

console.log("GIT PULL")
console.log("========")

shell.exec("node ./src/res/ci/common/git/pull.js")
console.log()

console.log(`Remember to reset ${PACKAGE.name} by running '/shutdown' in Discord!`)
console.log()
