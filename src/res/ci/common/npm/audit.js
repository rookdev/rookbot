import shell from 'shelljs'

console.log("NPM Audit")
console.log("---------")

let debug = {
  "betterNPMAudit": {
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

let tmp = shell.exec(
  "npm list -g --depth=0",
  { silent: true }
)
tmp = tmp.stdout.trim()
debug.betterNPMAudit.exists.global = tmp.includes("better-npm-audit")

tmp = shell.exec(
  "npm list --depth=0",
  { silent: true }
)
tmp = tmp.stdout.trim()
debug.betterNPMAudit.exists.user = tmp.includes("better-npm-audit")

// if not global, check user
// if not user, install global
// if global fails, install user

if (!(debug.betterNPMAudit.exists.global)) {
  if (!(debug.betterNPMAudit.exists.user)) {
    console.log("Better NPM Audit not installed at user level.")
    tmp = shell.exec(
      "npm i -g better-npm-audit",
      { silent: true }
    )
    debug.betterNPMAudit.installed.global = tmp.stderr.includes("npm ERR")
    if (!(debug.betterNPMAudit.exists.global)) {
      console.log("Better NPM Audit Global Install failed.")
      tmp = shell.exec(
        "npm i better-npm-audit",
        { silent: true }
      )
      debug.betterNPMAudit.installed.user = tmp.stderr.includes("npm ERR")
      if (!(debug.betterNPMAudit.installed.user)) {
        console.log("Better NPM Audit User Install failed.")
      }
    }
  }
}

if (
  debug.betterNPMAudit.exists.global ||
  debug.betterNPMAudit.exists.user ||
  debug.betterNPMAudit.installed.global ||
  debug.betterNPMAudit.installed.user
  ) {
  // FIXME:
  // Use ./node_modules/.bin/* if linux
  // Use ./* if not linux
  shell.exec("which better-npm-audit")
  shell.exec("better-npm-audit audit")
}
