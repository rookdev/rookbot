// @ts-nocheck

const { program } = require('commander')
const AsciiTable = require('ascii-table')
const PACKAGE = require('./package.json')
const shell = require('shelljs')
const path = require('path')
const fs = require('fs')

console.log("")
console.log("---")
console.log("dotenvx Entrypoint:")
console.log(PACKAGE.name, "v" + PACKAGE.version)

program
  .name(PACKAGE.name)
  .version(PACKAGE.version)
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
  // Long
  .option(
    "-l, --long", "Long?", false
  )
  // Environment: Development, Production
  .option(
    "-e, --environment <dev|prod>", "Environment to load",
    "development"
  )
  .option(
    "-lo, --loadoptions", "Load canned options (crun.json)"
  )
  .parse(process.argv)

let options = program.opts()
if (options.loadoptions && options.loadoptions != "") {
  options = require(
    path.join(
      __dirname,
      "crun.json"
    )
  )
} else {
  fs.writeFileSync(
    path.join(
      __dirname,
      "crun.json"
    ),
    JSON.stringify(options, null, "  ")
  )
}

// console.log("Options:")
// console.log(JSON.stringify(options, null, "  "))

let dotenvx = shell.exec("which dotenvx", { silent: true })
let uname = shell.exec("uname", { silent: true })

let bin = dotenvx.stdout.trim()
console.log(bin)
if (bin.indexOf("WinGet") > -1 || uname.stdout.trim().indexOf("MINGW") > -1) {
  bin = "dotenvx"
}
let envs = ""
let args = []

let haveCUser   = options.cu
let haveUser    = options.user
let haveClient  = options.client
let haveServer  = options.server

let user = ""
let client = ""
let server = ""
let env = ""
let long = ""
let profile = ""

// CUser
if (haveCUser && !haveUser && !haveClient) {
  envs += `-f ./env/devs/.env.token.${options.cu} `
  envs += `-f ./env/devs/.env.client.${options.cu} `
  user = options.cu
  client = options.cu
} else {
  if (haveUser && !haveServer) {
    envs += `-f ./env/devs/.env.token.${options.user} `
    user = options.user
  }
  if (!haveUser && haveServer) {
    envs += `-f ./env/servers/.env.token.${options.server} `
    server = options.server
  }
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

if (options.long) {
  args.push("-l")
  // @ts-ignore
  long = true
}
if (options.profile) {
  args.push(
    `-p ${options.profile}`
  )
  profile = options.profile
}

const Table = new AsciiTable("Selected Options:", {})
Table.addRow("Dev Token", user)
Table.addRow("Server Token", server)
Table.addRow("Dev Client ID", client)
Table.addRow("Development/Production", env)
Table.addRow("Selected Profile", profile)
Table.addRow("Long Load", long ? "Yes" : "No")
console.log(Table.toString())

let command = []
command.push(bin.trim())
command.push("run")
command.push(envs.trim())
command.push("--")
command.push("node ./run.js")
command.push(args.join(" "))

console.log("CLI Command:", command.join(" "))
shell.exec(command.join(" "))
