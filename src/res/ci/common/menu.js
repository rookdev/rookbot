// @ts-nocheck

import fs from "fs"
import chalk from "chalk"
const scripts = JSON.parse(fs.readFileSync("./scripts.json","utf8"))

for (let [scriptName,scriptHelp] of Object.entries(scripts.scripts)) {
  console.log(`${scriptName}`)
  console.log("-".repeat(scriptName.length))
  for (let help of scriptHelp) {
    if (help.includes("Version")) {
      help = chalk.blue(help)
    } else if (help.includes("Main")) {
      help = chalk.green(help)
    } else if (help.includes("Outdated")) {
      help = chalk.rgb(255,127,0)(help)
    } else if (help.includes("Dry")) {
      help = chalk.yellow(help)
    }
    console.log(help)
  }
  console.log()
}
