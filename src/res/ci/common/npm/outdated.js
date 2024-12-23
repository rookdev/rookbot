import shell from 'shelljs'

console.log("NPM Outdated")
console.log("------------")

let debug = {
  "NPMCheckUpdates": {
    "exists": {
      "user": false,
      "global": false
    },
    "installed": {
      "user": false,
      "global": false
    }
  }
}

let tmp = await shell.exec(
  "npm list -g --depth=0",
  { silent: true }
)
tmp = tmp.stdout.trim()
debug.NPMCheckUpdates.exists.global = tmp.includes("npm-check-updates")
// console.log(`NPM Check Updates ${debug.NPMCheckUpdates.exists.global ? "" :"not "}installed at Global level.`)

tmp = await shell.exec(
  "npm list --depth=0",
  { silent: true }
)
tmp = tmp.stdout.trim()
debug.NPMCheckUpdates.exists.user = tmp.includes("npm-check-updates")
// console.log(`NPM Check Updates ${debug.NPMCheckUpdates.exists.user ? "" :"not "}installed at User level.`)

// if not global, check user
// if not user, install global
// if global fails, install user

if (!(debug.NPMCheckUpdates.exists.global)) {
  if (!(debug.NPMCheckUpdates.exists.user)) {
    console.log("NPM Check Updates not installed at User level.")
    tmp = await shell.exec(
      "npm i -g npm-check-updates",
      { silent: true }
    )
    debug.NPMCheckUpdates.installed.global = tmp.stderr.includes("npm ERR")
    if (!(debug.NPMCheckUpdates.exists.global)) {
      console.log("NPM Check Updates Global Install failed.")
      tmp = await shell.exec(
        "npm i npm-check-updates",
        { silent: true }
      )
      debug.NPMCheckUpdates.installed.user = tmp.stderr.includes("npm ERR")
      if (!(debug.NPMCheckUpdates.installed.user)) {
        console.log("NPM Check Updates User Install failed.")
      }
    }
  }
}

let exitCode = 0

if (
  debug.NPMCheckUpdates.exists.global ||
  debug.NPMCheckUpdates.exists.user ||
  debug.NPMCheckUpdates.installed.global ||
  debug.NPMCheckUpdates.installed.user
  ) {
  // FIXME:
  // Use ./node_modules/.bin/* if linux
  // Use ./* if not linux
  shell.exec("which npm-check-updates")
  let outdated = await shell.exec("npm-check-updates", { silent: true })
  if (
    (outdated.stdout.trim() == "" && outdated.stderr.trim() == "") ||
    (outdated.stdout.trim().includes(":)"))
  ) {
    exitCode = 0
  } else {
    console.log(outdated.stdout.trim())
    console.log(outdated.stderr.trim())
    exitCode = 1
  }
}

if (exitCode == 0) {
  let outdated = await shell.exec("npm outdated", { silent: true })
  if (
    (outdated.stdout.trim() == "" && outdated.stderr.trim() == "") ||
    (outdated.stdout.trim().includes(":)"))
  ) {
    exitCode = 0
  } else {
    console.log(outdated.stdout.trim())
    console.log(outdated.stderr.trim())
    exitCode = 1
  }
}

if (exitCode == 0) {
  console.log("🟩  Up to Date")
}

shell.exit(exitCode)
