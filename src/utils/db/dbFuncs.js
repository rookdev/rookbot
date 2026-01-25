const { MongoClient, ServerApiVersion } = require('mongodb');
const fileFuncs = require('../fs/fileFuncs')
const fs = require('fs')

function createClient() {
  // Create a MongoClient with a MongoClientOptions object to set the Stable API version
  const uri = process.env.MONGODB_URL
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  })
  return client
}

async function getDB(cName, dName, source="mongodb") {
  if (source == "fs") {
    let path = [ "src", "dbs" ]
    if (cName) {
      path.push(cName)
    }
    if (dName) {
      return fileFuncs.getAFile(path, `${dName}.json`)
    } else {
      return fs.readdirSync(fileFuncs.getAPath(path)).filter(
        f => f.endsWith(".json")
      )
    }
  } else if (source == "mongodb") {
    let success = false
    
    const client = createClient()
    let rec = null

    try {
      // Connect the client to the server	(optional starting in v4.7)
      await client.connect()
      // Send a ping to confirm a successful connection
      let db_name = "db"
      let db = client.db(db_name)

      let coll_name = cName
      let rec_name = dName

      if (db) {
        let coll = db.collection(coll_name)
        if (coll) {
          let docs = await coll.find().toArray()
          if (docs) {
            let gName = ""
            for await (let doc of docs) {
              gName = doc._gname
              if (rec_name) {
                rec = doc[rec_name]
              } else {
                rec = Object.keys(doc).filter(k=>!k.startsWith("_"))
              }
            }
            if (rec) {
              console.log(`💿MongoDB: '${gName}' [${cName}]: ${dName}`)
              success = true
            }
          }
        }
      }
    } finally {
      // Ensures that the client will close when you finish/error
      await client.close()
    }

    if (source == "mongodb") {
      if (!success) {
        return await getDB(cName, dName, "fs")
      } else {
        return rec
      }
    }
  }

  return false
}

module.exports = {
  createClient,
  getDB
}
