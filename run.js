// @ts-check
const { program } = require('commander')  // Commander for CLI management
const AsciiTable = require('ascii-table') // Pretty-print in console
const PACKAGE = require('./package.json') // Node Package data
const emojis = require('./src/dbs/emojis.json') // Global Emojis
const shell = require('shelljs')          // Run shell commands

// This is what is intended to run Bot Main (./src/index.js)
// Print Package version
console.log("")
console.log("---")
console.log("Bot Entrypoint:")
console.log(PACKAGE.name, "v" + PACKAGE.version)

// Create CLI structure
program
  .name(PACKAGE.name)       // App Name
  .version(PACKAGE.version) // App Version
  .usage("[OPTIONS]...")
  // Profile Name
  .option(
    "-p, --profile <profile>", "Profile", "default"
  )
  // Long; run all sanity checks
  .option(
    "-l, --long", "Long?", false
  )
  // Delete Commands
  .option(
    "--del", "Delete?", false
  )
  // Purge Commands
  .option(
    "--purge", "Purge?", false
  )
  // Parse passed arguments
  .parse(process.argv)

// Gather passed arguments
const options = program.opts()
// console.log("Options")
// console.log(JSON.stringify(options, null, "  "))

let long = options.long       // Long Mode?
let del = options.del         // Delete Commands?
let purge = options.purge         // Purge Commands?
let profile = options.profile // Profile to load

// Pretty-print selections to console
const Table = new AsciiTable("Selected Options", {})
Table.setBorder('|','-','•','•')
Table.addRow("Selected Profile", profile)
Table.addRow("Long Load", long ? emojis.check : emojis.nocheck)
Table.addRow("Delete Commands?", del ? emojis.check : emojis.nocheck)
Table.addRow("Purge Commands?", purge ? emojis.check : emojis.nocheck)
console.log(Table.toString())

// If Long Mode
let QUICK = !options.long
if (!QUICK) {
  // Print Version info about:
  //  Node, NPM, Discord.js, Bot
  shell.exec("node ./src/res/ci/common/ver.js")
  console.log()

  // Run NPM Audit
  // Prefer using better-npm-audit
  // Fallback to npm audit
  shell.exec("node ./src/res/ci/common/npm/audit.js")
  console.log()

  // Run NPM Outdated
  // Prefer useing npm-check-updates
  // Fallback to npm outdated
  shell.exec("node ./src/res/ci/common/npm/outdated.js")
}

// Handles to adjust verbosity
let TRACE_WARNINGS = false
let TRACE_DEPRECATIONS = true
let UNHANDLED_REJECTIONS = false
// Profile to load
let args = [
  `-p ${options.profile}`
]
if (del) {
  args.push("--del")
}
if (purge) {
  args.push("--purge")
}

// Use node to run ./src/index.js with CLI args
let command = "node "
if (TRACE_WARNINGS) {
  command += "--trace-warnings "
}
if (TRACE_DEPRECATIONS) {
  command += "--trace-deprecation "
}
if (UNHANDLED_REJECTIONS) {
  command += "--unhandled-rejections=strict "
}
command += "./src/index.js "
command += args.join(" ")

// Print & run shell command
command = command.trim()
console.log("CLI Command:", command)
shell.exec(command)
