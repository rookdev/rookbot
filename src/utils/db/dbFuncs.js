const { MongoClient, ServerApiVersion } = require('mongodb');
const fileFuncs = require('../fs/fileFuncs')
const numFuncs = require('../../utils/primitives/numFuncs')
const fs = require('fs')

function createClient() {
  // Create a MongoClient with a MongoClientOptions object to set the Stable API version
  const uri = process.env.MONGODB_URL
  if (uri) {
    const client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
      }
    })
    return client
  } else {
    return null
  }
}

async function getDB(cName, dName, platform="discord", source="mongodb") {
  let messages = []
  if (source == "fs") {
    let path = [ "src", "dbs" ]
    if (cName) {
      path.push(cName)
    }
    if (dName) {
      let gName = ""
      messages.push(`💾 FS: '${gName}' [${cName}]: ${dName}`)
      return [fileFuncs.getAFile(path, `${dName}.json`), messages]
    } else {
      let fileList = []
      if (fs.existsSync(fileFuncs.getAPath(path))) {
        fileList = fs.readdirSync(fileFuncs.getAPath(path)).filter(
          f=>f.endsWith(".json")
        )
      } else {
        messages.push(`${path} not found!`)
      }
      return [fileList, messages]
    }
  } else if (source == "mongodb") {
    let success = false
    
    const client = createClient()
    let rec = null

    if (client) {
      try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect()
        // Send a ping to confirm a successful connection
        let db_name = "db"
        let db = client.db(db_name)

        let coll_name = cName
        let rec_name = dName

        if (db) {
          // console.log(`Got DB: ${db_name}`)
          let coll = db.collection(coll_name)
          if (coll) {
            // console.log(`Got Coll: ${coll_name}`)
            let docs = await coll.find().toArray()
            if (docs) {
              // console.log(`Got Docs`)
              let gName = ""
              for await (let doc of docs) {
                // console.log(`Got Doc`)
                gName = doc?._gname
                // console.log(
                //   {
                //     cName,
                //     dName,
                //     platform,
                //     source,
                //     gName: doc?._gname,
                //   }
                // )
                if (doc?._platform == platform) {
                  if (rec_name) {
                    rec = doc[rec_name]
                  } else {
                    dName = "<list>"
                    rec = Object.keys(doc).filter(k=>!k.startsWith("_"))
                  }
                } else if (
                  (!doc?._platform) &&
                  (!numFuncs.myIsNumeric(rec_name))
                ) {
                  rec = doc[rec_name]
                }
              }
              if (rec) {
                messages.push(`💿 MongoDB: '${gName}' [${cName}]: ${dName}`)
                success = true
              }
            }
          }
        }
      } finally {
        // Ensures that the client will close when you finish/error
        await client.close()
      }
    }

    if (source == "mongodb") {
      if (!success) {
        return await getDB(cName, dName, platform, "fs")
      } else {
        return [rec, messages]
      }
    }
  }

  return false, []
}

module.exports = {
  createClient,
  getDB
}
