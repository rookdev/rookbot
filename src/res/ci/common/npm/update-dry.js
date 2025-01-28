// @ts-nocheck

import shell from 'shelljs'

console.log("NPM Update (dry run)")
console.log("--------------------")
shell.exec("npm up --dry-run")
