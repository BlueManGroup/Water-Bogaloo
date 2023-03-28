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
        let userObj = {
            username: data.username,
            password: data.password,
            tokens: 0,
            role: "user"
        };
        
        response = await db.collection("users").insertOne(userObj);


        if (!response.acknowledged) throw new Error; 
        let user = {username: data.username, _id: response.insertedId};
        return user;
    } else {
        return false;
    }
    
}

//Delete operation (curently only supports deleting own user. May be changed for admin panel
//or token implementation)
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
    
    try {await db.collection("users").updateOne(
        {_id: oid},
        {$set: {[parameter]: data}})
        } catch(e) {
            console.error(e)
            return({e: "error: update failed"})
        }
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

    try {
        let result = await db.collection(collection).findOne(iobject, {projection:fields});
        return result;
    } catch (e) {
        console.error(e);
        return({e: "error: read failed"});
    }
}

async function readall(collection,fields) {
    await checkColl(collection);

    try {
        let result = await db.collection(collection).find({},{projection:fields}).toArray();
        return result;
    } catch (e) {
        console.error(e);
        return({e: "error: read failed"});
    }

}


module.exports = {
    create, read, del, update, readall
};