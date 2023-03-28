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


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//..........................................................CREATE_FUNCTIONS.......................................................//
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//create user **Needs input validation**
async function createUser(data) {
    if (!(await readUser(data, {username: 1}))){
        let userObj = {
            username: data.username,
            password: data.password,
            tokens: [],
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

// Create token(s)
// create x tokens and link them to user
async function createTokens(user, amount) {
    let userObj = await readUser({username: user}, {_id: 1});
    if (!userObj) {
        return "invalid user";
    }
    // currently empty, only want an id to know that this token exists in mongodb
    try {
        // list of added token ids
        tokens = []

        for (let i = 0; i < amount; i++) {
            let tokenObj = {}
            let tokenRes = await db.collection("tokens").insertOne(tokenObj);
            await db.collection("users").updateOne(
                { _id: userObj._id },
                { $push: { tokens: tokenRes.insertedId }}
                );
            tokens.push(tokenRes.insertedId);
        }


        return tokens;
    } catch(e) {
        console.error(e);
        return e;
    }
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//..........................................................READ_FUNCTIONS.........................................................//
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//read operation 
async function readUser(identifier, fields) {
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
        let result = await db.collection("users").findOne(iobject, {projection:fields});
        return result;
    } catch (e) {
        console.error(e)
        return({e: "error: read failed"})
    }
}

async function readall(collection,fields) {
    await checkColl(collection)

    try {
        let result = await db.collection(collection).find({},{projection:fields}).toArray()
        return result
    } catch (e) {
        console.error(e)
        return({e: "error: read failed"})
    }

}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//..........................................................UPDATE_FUNCTIONS.......................................................//
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//Update operation **Needs input validation**
async function updateUser(userid,parameter,data) {
    let oid = new ObjectId(userid);
    
    try {await db.collection("users").updateOne(
        {_id: oid},
        {$set: {[parameter]: data}})
        } catch(e) {
            console.error(e)
            return({e: "error: update failed"})
        }
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//..........................................................DELETE_FUNCTIONS.......................................................//
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//Delete user operation (curently only supports deleting own user. May be changed for admin panel)
async function deleteUser(userId) {
    try {
        let oid = new ObjectId(userId);
        await db.collection("users").deleteOne({_id: oid});  
        return "success";  
    } catch(e) {
        console.error(e);
        return e;
    }
}

async function deleteToken(userId, tokenId) {

    let result = {
        tokenRes: null,
        userRes: null
    }

    try {
        result['tokenRes'] = await db.collection("tokens").deleteOne(tokenId);
        result['userRes'] = await db.collection("users").updateOne(
            {_id: userId},
            { $pull: { tokens: { $eq: tokens[0]}, $slice: 1} }
        );

        return result;
    } catch(e) {
        console.error(e);
        return e;
    }
}






module.exports = {
    createUser, createTokens, readUser, deleteUser, deleteToken, updateUser, readall
};