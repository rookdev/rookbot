// @ts-check
const { program } = require('commander')  // Commander for CLI management
const AsciiTable = require('ascii-table') // Pretty-print in console
const PACKAGE = require('./package.json') // Node Package data
const shell = require('shelljs')          // Run shell commands
const path = require('path')              // Easy filepath management
const fs = require('fs')                  // Filesystem manipulation

// This is what is intended to run dotenvx
// Print Package version
console.log("")
console.log("---")
console.log("dotenvx Entrypoint:")
console.log(PACKAGE.name, "v" + PACKAGE.version)

// Create CLI structure
program
  .name(PACKAGE.name)       // App Name
  .version(PACKAGE.version) // App Version
  .usage("[OPTIONS]...")
  // Profile Name
  .option(
    "-p, --profile <profile>", "Profile name to load from PROFILE.json"
  )
  // Client ID
  .option(
    "-c, --client <username>", "Developer Client ID .env to load"
  )
  // User ID
  .option(
    "-u, --user <username>", "Developer User Token .env to load"
  )
  // Client ID & User ID
  .option(
    "--cu <client/user>", "Developer Client ID & User TOken .env to load"
  )
  // Server ID
  .option(
    "-s, --server <username>", "Server Token .env to load"
  )
  // Long; run all sanity checks
  .option(
    "-l, --long", "Long?", false
  )
  // Environment: Development, Production
  .option(
    "-e, --environment <dev|prod>", "Environment to load",
    "development"
  )
  // Delete Commands?
  .option(
    "--del", "Delete Commands", false
  )
  // Load canned options (crun.json)
  .option(
    "-lo, --loadoptions", "Load canned options (crun.json)"
  )
  // Parse passed arguments
  .parse(process.argv)

// Gather passed arguments
let options = program.opts()

// If we're loading canned options, get them
if (options.loadoptions && options.loadoptions != "") {
  options = require(
    path.join(
      __dirname,
      "crun.json"
    )
  )
} else {
  // Else, write what we used this time to canned options
  fs.writeFileSync(
    path.join(
      __dirname,
      "crun.json"
    ),
    JSON.stringify(options, null, "  ")
  )
}

// console.log("Options")
// console.log(JSON.stringify(options, null, "  "))

let dotenvx = shell.exec("which dotenvx", { silent: true }) // Collect dotenvx location
let uname = shell.exec("uname", { silent: true })           // Get OS name

// Get dotenvx executable path
let bin = dotenvx.stdout.trim()
console.log(bin)

// If Windows, just run bare executable
if (bin.indexOf("WinGet") > -1 || uname.stdout.trim().indexOf("MINGW") > -1) {
  bin = "dotenvx"
}

let envs = "" // Bucket for env vars to pass to dotenvx
let args = [] // Bucket for CLI arguments to pass to run.js

let haveCUser   = options.cu      // Bundled Client & User
let haveUser    = options.user    // User
let haveClient  = options.client  // Client
let haveServer  = options.server  // Server

let user = ""
let client = ""
let server = ""
let env = ""
let long = ""
let del = ""
let profile = ""

// CUser
if (haveCUser && !haveUser && !haveClient) {
  // Set User Token & Client ID
  envs += `-f ./env/devs/.env.token.${options.cu} `
  envs += `-f ./env/devs/.env.client.${options.cu} `
  user = options.cu
  client = options.cu
} else {
  // Set User Token
  if (haveUser && !haveServer) {
    envs += `-f ./env/devs/.env.token.${options.user} `
    user = options.user
  }
  // Set Server Token
  if (!haveUser && haveServer) {
    envs += `-f ./env/servers/.env.token.${options.server} `
    server = options.server
  }
  // Set Client ID
  if (haveClient) {
    envs += `-f ./env/devs/.env.client.${options.client} `
    client = options.client
  }
}

// Dev | Prod
if (options.environment) {
  env = options.environment.startsWith("prod") ? "prod" : "dev"
  envs += `-f ./env/envs/.env.${env} `
}

// Profile to load
if (options.profile) {
  args.push(
    `-p ${options.profile}`
  )
  profile = options.profile
}
// Delete Commands?
if (options.del) {
  args.push("--del")
  // @ts-ignore
  del = true
}
// Long Mode?
if (options.long) {
  args.push("-l")
  // @ts-ignore
  long = true
}

// Pretty-print selections to console
const Table = new AsciiTable("Selected Options", {})
Table.addRow("Dev Token", user)
Table.addRow("Server Token", server)
Table.addRow("Dev Client ID", client)
Table.addRow("Development/Production", env)
Table.addRow("Selected Profile", profile)
Table.addRow("Long Load", long ? "Yes" : "No")
Table.addRow("Delete Commands?", del ? "Yes" : "No")
console.log(Table.toString())

// Use dotenvx with env vars to use node to run run.js with CLI args
let command = []
command.push(bin.trim())
command.push("run")
command.push(envs.trim())
command.push("--")
command.push("node ./run.js")
command.push(args.join(" "))

// Print & run shell command
console.log("CLI Command:", command.join(" "))
shell.exec(command.join(" "))
