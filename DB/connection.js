const MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
const jwt = require('../Tokens/JWT');

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

    if (!colls.includes(collection)) {
        throw new Error("invalid collection");
    }
}

//create operation **Needs input validation**
async function create(collection,data,) {
    await checkColl(collection);

    if (!(await read("users",data,{username: 1}))){
        response = await db.collection("users").insertOne(data);
        if (!response.acknowledged) throw new Error; 
        let user = {username: data.username, _id: response.insertedId}
        return user
    } else {
        return false;
    }
    
}

async function del(collection, userToken) {
    await checkColl(collection);

    let userId = jwt.decodeToken(userToken.token).userId;
    let oid = new ObjectId(userId);
    await db.collection(collection).deleteOne({_id: oid});    
}

//Update operation **Needs input validation**
async function update(collection,userid,parameter,data) {
    let oid = new ObjectId(userid);

    await checkColl(collection);
    await db.collection("users").updateOne(
        {_id: oid},
        {$set: {[parameter]: data}},
        (err, result) => {
            if (err) {
                console.error(err);
            } else {
                console.log(result);
            }  
        }
    );
}

//read operation 
async function read(collection, identifier, fields) {
    await checkColl(collection);

    let iobject = null;
    let oid = null;
    switch(Object.keys(identifier)[0]) {

        case "username":
            iobject = {username: identifier.username};
            break;

        case "userid":
            oid = new ObjectId(identifier.userid);
            iobject = {_id:oid};
            break;
    }
    
    let result = await db.collection("users").findOne(iobject, {projection:fields});
    
    return result;
}


module.exports = {
    create, read, del, update
};