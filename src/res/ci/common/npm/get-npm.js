// @ts-nocheck

import shell from 'shelljs'
import os from 'os'

console.log("Update NPM")
console.log("----------")
if(os.platform().toLowerCase().includes("linux")) {
  shell.exec("sudo npm i -g npm@latest")
} else {
  shell.exec("npm i -g npm@latest")
}
