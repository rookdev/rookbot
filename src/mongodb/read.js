const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.MONGODB_URL;

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
    coll_name = "1450159772622913628"
    rec_name = "roles"

    let db = client.db(db_name)
    let collList = db.listCollections()

    console.log(`DB: ${db_name}`)

    // Read All
    if (coll_name == "all") {
      for await (let collMeta of collList) {
        if (collMeta.name != "index") {
          console.log(` Coll: ${collMeta.name}`)
          let coll = db.collection(collMeta.name)
          let docs = await coll.find().toArray()
          for (let doc of docs) {
            // doc is data structure of JSON document
            console.log(`  Doc: ${doc._id}`)
            console.log(`   ${doc._gname}`)
            for (let key of Object.keys(doc)) {
              if (!key.startsWith("_")) {
                console.log(`    ${key}`)
              }
            }
          }
        }
      }
    } else {
      let coll = db.collection(coll_name)
      let docs = await coll.find().toArray()
      let rec = null
      console.log(` Coll: ${coll_name}`)
      for (let doc of docs) {
        console.log(`  Doc: ${doc._id}`)
        console.log(`   ${doc._gname}`)
        rec = doc[rec_name]
        console.log(`    ${JSON.stringify(rec)}`)
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
