// @ts-nocheck

import shell from 'shelljs'

console.log("UPDATE 🔨")
console.log("=========")

shell.exec("node ./src/res/ci/common/ver.js")
console.log()

let outdated = shell.exec("node ./src/res/ci/common/npm/outdated.js").code == 1
console.log("")

if (outdated) {
  console.log("NPM Update 🔨")
  console.log("-------------")
  let check = shell.exec("npm-check-updates -u", { silent: true })
  let needUpdate = true
  // if (
  //   (check.stdout.trim() == "" && check.stderr.trim() == "") ||
  //   (check.stdout.trim().includes(":)"))
  // ) {
  //   console.log("🟩  Up to Date")
  //   needUpdate = false
  // } else {
  //   console.log(check.stdout.trim())
  //   console.log(check.stderr.trim())
  //   needUpdate = true
  // }

  if (needUpdate) {
    shell.exec("npm up")
    console.log()
    shell.exec("node ./src/res/ci/common/npm/outdated.js")
  }
}
