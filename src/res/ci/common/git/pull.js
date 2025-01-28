// @ts-nocheck

import shell from 'shelljs'

let DEBUG = false

console.log("Pull")
console.log("----")
shell.exec("node ./src/res/ci/common/ver.js")
console.log()

let commands = [
  "git checkout main",
  "git pull origin main"
]

if (DEBUG) {
  for (let line of commands) {
    console.log(`bot@rook$ ${line}`)
  }
} else {
  for (let line of commands) {
    shell.exec(line)
  }
}
