// @ts-check
const { program } = require('commander')  // Commander for CLI management
const AsciiTable = require('ascii-table') // Pretty-print in console
const shell = require('shelljs')          // Run shell commands

console.log("")
console.log("---")
console.log("Bot Entrypoint:")

program
  .name("MongoDB Diagnostics")
  .usage("[OPTIONS]...")
  .option(
    "-m, --mode <mode>", "Mode to run"
  )
  .parse(process.argv)

let options = program.opts()
let mode = options.mode ?? "ping"

// Handles to adjust verbosity
let TRACE_WARNINGS = false
let TRACE_DEPRECATIONS = true
let UNHANDLED_REJECTIONS = false
// Profile to load
let args = []

if (mode) {
  args.push(
    `-m ${mode}`
  )
}

const Table = new AsciiTable("Selected Options", {})
Table.setBorder('|','-','•','•')
Table.addRow("Mode", mode)
console.log(Table.toString())
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
command += `./src/mongodb/${mode.toLowerCase()}.js `
command += args.join(" ")

// Print & run shell command
command = command.trim()
console.log("CLI Command:", command)
shell.exec(command)
