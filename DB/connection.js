const MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
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

// Check if collection is in database
// If not, get error
async function checkColl(collection) {
    colls = ["users", "tokens"];
    if (!(collection in colls)) {
        throw new error("invalid collection");
    }
}

//create operation **Needs input validation**
async function create(collection,data,) {
    await checkColl(collection);
    
    await db.collection("users").insertOne(data)
}

async function del(collection, data) {
    await checkColl(collection);

    let oid = new ObjectId(data._id);

    await db.collection(collection).deleteOne({_id: oid});    
}

//Update operation **Needs input validation**
async function update(collection,identifier,parameter,data) {
    await checkColl(collection);
    await db.collection("users").updateOne(
    {_id: identifier},
    {$set: {parameter: data}},
    (err, result) => {
        if (err) {
            console.error(err);
        } else {
            console.log(result);
        }  
    });
}


//read operation 
async function read(collection,data,) {
    await checkColl(collection);
    await db.collection("users").findOne({username:data});

}


module.exports = {
    create,read, del
};