// @ts-nocheck

const { program } = require('commander')
const AsciiTable = require('ascii-table')
const PACKAGE = require('./package.json')
const shell = require('shelljs')

console.log("")
console.log("---")
console.log("Bot Entrypoint:")
console.log(PACKAGE.name, "v" + PACKAGE.version)

program
  .name(PACKAGE.name)
  .version(PACKAGE.version)
  .usage("[OPTIONS]...")
  // Profile Name
  .option(
    "-p, --profile <profile>", "Profile", "default"
  )
  // Long?
  .option(
    "-l, --long", "Long?", false
  )
  .parse(process.argv)

const options = program.opts()
// console.log("Options:")
// console.log(JSON.stringify(options, null, "  "))

let profile = options.profile
let long = options.long

const Table = new AsciiTable("Selected Options:", {})
Table.addRow("Selected Profile", profile)
Table.addRow("Long Load", long ? "Yes" : "No")
console.log(Table.toString())

let QUICK = !options.long
if (!QUICK) {
  shell.exec("node ./src/res/ci/common/ver.js")
  console.log()

  shell.exec("node ./src/res/ci/common/npm/audit.js")
  console.log()

  shell.exec("node ./src/res/ci/common/npm/outdated.js")
}

let TRACE_WARNINGS = false
let TRACE_DEPRECATIONS = true
let UNHANDLED_REJECTIONS = false
let args = [
  `-p ${options.profile}`
]

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

command = command.trim()
console.log("CLI Command:", command)
shell.exec(command)
