// @ts-check
// Standalone npm install
const PACKAGE = require('./package.json') // Node Package data
const shell = require('shelljs')          // Run shell commands

console.log("NPM INSTALL")
console.log("===========")

shell.exec("node ./src/res/ci/common/npm/install.js")
console.log()

console.log(`Remember to reset ${PACKAGE.name} by running '/shutdown' in Discord!`)
console.log()
