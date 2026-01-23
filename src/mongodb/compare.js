const { MongoClient, ServerApiVersion } = require('mongodb');
const sortKeysRecursive = require('sort-keys-recursive');
const globalFuncs = require('../utils/primitives/globalFuncs')
const fileFuncs = require('../utils/fs/fileFuncs')
const util = require('util')
const uri = process.env.MONGODB_URL;
const fs = require('fs');

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    let db_name = "db"
    let coll_name = "all"

    let db = client.db(db_name)
    let collList = db.listCollections()

    console.log(`DB: ${db_name}`)

    let diffs = []

    // Read All
    if (coll_name == "all") {
      for await (let collMeta of collList) {
        if (collMeta.name != "index") {
          let guildID = collMeta.name
          console.log(` Coll: ${guildID}`)
          let coll = db.collection(guildID)
          let docs = await coll.find().toArray()
          for (let doc of docs) {
            // doc is data structure of JSON document
            doc = sortKeysRecursive(JSON.parse(JSON.stringify(doc)))
            console.log(`  Doc: ${doc._id}`)
            console.log(`   ${doc._gname}`)
            let guildDir = fileFuncs.getAPath(
              [
                "src",
                "mongodb",
                "output",
                "lastpull",
                guildID
              ]
            )
            fs.mkdirSync(
              guildDir + "/" + "db",
              { recursive: true }
            )
            fs.writeFileSync(
              fileFuncs.getAPath(
                [
                  guildDir,
                  "db"
                ],
                `.${doc._gname}`
              ),
              ""
            )
            fs.writeFileSync(
              fileFuncs.getAPath(
                [
                  guildDir,
                  "db"
                ],
                `${doc._id}.json`
              ),
              JSON.stringify(doc)
            )
            for (let key of Object.keys(doc)) {
              if (!key.startsWith("_")) {
                // Compare sorted result to /src/dbs
                let check = "?"
                let jsDB = fileFuncs.getAFile(
                  [
                    "src",
                    "dbs",
                    guildID
                  ],
                  `${key}.json`
                )
 
                jsDB = sortKeysRecursive(jsDB)

                if (
                  doc[key] &&
                  !globalFuncs.empty(doc[key]) &&
                  !util.isDeepStrictEqual(jsDB, doc[key])
                ) {
                  check = "♻️"
                  // Write individual sorted to disk
                  let diffDir = guildDir.replace("lastpull","diffdb")
                  fs.mkdirSync(
                    diffDir,
                    { recursive: true }
                  )
                  fs.writeFileSync(
                    fileFuncs.getAPath(
                      diffDir,
                      `.${doc._gname}`
                    ),
                    ""
                  )
                  fs.writeFileSync(
                    fileFuncs.getAPath(
                      diffDir,
                      `${key}.json`
                    ),
                    JSON.stringify(doc[key], null, 2)
                  )
                  fs.writeFileSync(
                    fileFuncs.getAPath(
                      diffDir,
                      `${key}.db.json`
                    ),
                    JSON.stringify(jsDB, null, 2)
                  )
                  diffs.push(
                    `${doc._gname} [${guildID}]: ${key}`
                  )
                } else {
                  check = "✅"
                }
                console.log(`    ${check}${key}`)
              }
            }
          }
        }
      }
      if (!globalFuncs.empty(diffs)) {
        console.log("")
        console.log("Discrepancies")
        console.log("---")
        console.log(diffs.join("\n"))
      }
    }

  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}

console.log("")
console.log("---")
console.log("MongoDB Main:")

run().catch(console.dir);
