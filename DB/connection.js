const MongoClient = require('mongodb').MongoClient;
require('dotenv').config()

//.env variables
DBURI = process.env.DBURI

const client = new MongoClient(DBURI, { useNewUrlParser: true, useUnifiedTopology: true });

//MongoDB connection
async function connectToDatabase() {
    try {
      await client.connect();
      console.log("Connected to MongoDB!");
    } catch (err) {
      console.error("Failed to connect to MongoDB", err);
    }
  }
  connectToDatabase();

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

//Update operation **Needs input validation**
async function update(collection,identifier,parameter,data) {
    if(collection == "users") {
      await db.collection("users").updateOne(
        {_id: identifier},
        {$set: {parameter: data}},
        (err, result) => {
          if (err) {
            console.error(err);
          } else {
            console.log(result);
          }  
        }
      );
    }

}


module.exports = {
    create,
};