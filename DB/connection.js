const MongoClient = require('mongodb').MongoClient;
require('dotenv').config()

//.env variables
DBURI = process.env.DBURI

//MongoDB connection
const client = new MongoClient(DBURI, { useNewUrlParser: true, useUnifiedTopology: true })
client.connect(err => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
})

//Database connection
const db = client.db("Slusen")


//create operation **Needs input validation**
async function create(collection,data,) {
    if(collection == "users") {
        await db.collection("users").insertOne(data)
    } else {
        throw new error("invalid collection")
    }
}

module.exports = {
    create,
};