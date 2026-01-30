const fileFuncs = require('../utils/fs/fileFuncs')
const dbFuncs = require('../utils/db/dbFuncs')
const shell = require('shelljs')
const fs = require('fs')

async function run() {
  let mongodb_compare = null
  try {
    let mode = "compare"
    mongodb_compare = shell.exec(
      `node ./src/mongodb/crun.js -m ${mode}`
    )
    mongodb_compare = mongodb_compare.stdout.trim()
  } catch (err) {
    console.log(err.stack)
  }

  let src = fileFuncs.getAPath(
    [
      "src",
      "mongodb",
      "output",
      "diffdb"
    ]
  )
  if (fs.existsSync(src)) {
    let newFiles = fs.globSync("**/*.db.json")
    if (newFiles) {
      let client = null
      try {
        client = dbFuncs.createClient()

        // Connect the client to the server	(optional starting in v4.7)
        await client.connect()
        // Send a ping to confirm a successful connection
        let db_name = "db"
        let db = client.db(db_name)
        console.log(`DB: ${db_name}`)

        for (filePath of fs.globSync("**/*.db.json")) {
          let matches = filePath.match(/[\D]+([\d]+)[\/]([^\.]+)/)
          if (matches) {
            let coll_name = matches[1]
            let rec_name = matches[2]
            let coll = db.collection(coll_name)
            console.log(` Coll: ${coll_name}`)
            let docs = await coll.find().toArray()
            let inputText = fileFuncs.getAFile(filePath, "", "txt")
            let inputJSON = JSON.parse(inputText)
            for (let doc of docs) {
              if (doc[rec_name]) {
                console.log(`  Doc: ${doc._id}`)
                console.log(`   ${doc._gname}`)
                console.log(`   ⬆️ ${rec_name}`)
                // console.log(`    Existing: ${JSON.stringify(doc[rec_name])}`)
                // console.log(`    Updating: ${JSON.stringify(inputJSON)}`)
                let record = {}
                record[rec_name] = inputJSON
                let updateDocument = { $set: record }
                // console.log(`     Sending: ${JSON.stringify(updateDocument)}`)
                let result = await coll.updateOne(
                  { _gid: coll_name },
                  updateDocument
                )
                if (!result) {
                  console.log(`    ❌Failed update!`)
                }
                if (!result.acknowledged) {
                  console.log(`    ❌Failed acknowledgement!`)
                }
                if (!result.matchedCount > 0) {
                  console.log(`    ❌No records updated!`)
                }
                if (result) {
                  if (result.acknowledged) {
                    if (result.modifiedCount > 0) {
                      console.log(`    ✅Success!`)
                    }
                  }
                }
              }
            }
          }
        }
      } finally {
        client.close()
      }
    }
  } else {
    console.log("No new files.")
  }
}

console.log("")
console.log("---")
console.log("MongoDB Upload:")

run().catch(console.dir);
