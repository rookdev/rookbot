// @ts-nocheck

import shell from 'shelljs'

console.log("AUDIT 💊")
console.log("========")

shell.exec("node ./src/res/ci/common/ver.js")
console.log()

shell.exec("node ./src/res/ci/common/npm/audit.js")
console.log()

shell.exec("node ./src/res/ci/common/npm/install-dry.js")
console.log()

shell.exec("node ./src/res/ci/common/npm/update-dry.js")
console.log()

shell.exec("node ./src/res/ci/common/npm/outdated.js")
