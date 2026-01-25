const dbFuncs = require('../utils/db/dbFuncs')

async function run() {
  let client = null
  try {
    client = dbFuncs.createClient()

    // Connect the client to the server	(optional starting in v4.7)
    await client.connect()
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. Touched `admin` database. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}

console.log("")
console.log("---")
console.log("MongoDB Ping:")

run().catch(console.dir);
