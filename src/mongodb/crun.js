// @ts-nocheck
const { program } = require('commander')  // Commander for CLI management
const AsciiTable = require('ascii-table') // Pretty-print in console
const shell = require('shelljs')          // Run shell commands

console.log("")
console.log("---")
console.log("dotenvx Entrypoint:")

program
  .name("MongoDB Diagnostics")
  .usage("[OPTIONS]...")
  .option(
    "-m, --mode <mode>", "Mode to run"
  )
  .parse(process.argv)

let options = program.opts()

let dotenvx = shell.exec("which dotenvx", { silent: true }) // Collect dotenvx location
let uname = shell.exec("uname", { silent: true })           // Get OS name

// Get dotenvx executable path
let bin = dotenvx.stdout.trim()
console.log("dotenvx path: " + bin)

// If Windows, just run bare executable
if (bin.includes("WinGet") || uname.stdout.trim().includes("MINGW")) {
  bin = "dotenvx"
}

let envs = "" // Bucket for env vars to pass to dotenvx
let args = [] // Bucket for CLI arguments to pass to run.js

let mode = options?.mode && !["crun","run"].includes(options.mode) ? options.mode : "ping"

envs += `-f ./env/db/.env.mongodb `

if (mode) {
  args.push(
    `-m ${mode}`
  )
}

const Table = new AsciiTable("Selected Options", {})
Table.setBorder('|','-','•','•')
Table.addRow("Mode", mode)
console.log(Table.toString())

// Use dotenvx with env vars to use node to run run.js with CLI args
let command = []
command.push(bin.trim())
command.push("run")
command.push(envs.trim())
command.push("--")
command.push("node ./src/mongodb/run.js")
command.push(args.join(" "))

// Print & run shell command
console.log("CLI Command:", command.join(" "))
shell.exec(command.join(" "))
