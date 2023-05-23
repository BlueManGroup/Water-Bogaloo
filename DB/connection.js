const MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
const jwt = require('../utilities/JWT');

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

// dateStart, dateEnd, action, initiator, receiver
async function constructQuery(queryObj) {
    let query = {}

    if (queryObj.action && queryObj.action.length > 0) {
        query.action = {$in: queryObj.action};
    }

    if (queryObj.dateStart && queryObj.dateEnd) {
        query.date = {
            $gte: queryObj.dateStart,
            $lte: queryObj.dateEnd
        }
    }

    if (queryObj.initiator || queryObj.receiver) {
        query.$or = []

        if (queryObj.initiator) {
            query.$or.push({"userObj.initiator":queryObj.initiator});
        }
        if (queryObj.receiver) {
            query.$or.push({"userObj.receiver":queryObj.receiver});
        }
    }
    return query;
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
    let userObj = await readUser({username: user}, {_id: 1, tokens: 1});
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


        return {tokens: tokens, userTokenAmount: userObj.tokens.length + tokens.length};
    } catch(e) {
        console.error(e);
        return e;
    }
}

// create log in 
/* passed object: 
{
    action: string // redeem or distribute
    userObj: { // dunno if we go with userid or username
        receiver: string/objectid // does not exist if action is redeem
        initiator: string/objectid // if redeem, user who redeemed. if distributor, user who distributed
        tokenid: objectid // only if action == distribute
    }
}*/
// assumed that everything checks out when get to here, no need to check jwt or other things.
async function createLogEntry(reqObj) {
    try {
        // get date
        reqObj.date = new Date().toISOString();

        let result = await db.collection("log").insertOne(reqObj);
        return result;
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
        console.error(e);
        return null;
    }
}

async function readall(collection,fields) {
    await checkColl(collection);

    try {
        let result = await db.collection(collection).find({},{projection:fields}).toArray();
        if (result.tokens) results.token = results.token.length;
        return result;
    } catch (e) {
        console.error(e);
        return({e: "error: read failed"});
    }

}


// dateStart, dateEnd, action, initiator, receiver
async function readLog(reqObj) {
    try {
        let query = await constructQuery(reqObj);

        let result = await db.collection("log").find(query).toArray();
        // result is an array of objects - not an object itself. therefore the following
        // line does not get the length - need to iterate through all logs and do manually
        // or make the token field an object with an array and an int
        if (result.tokens) result.token = result.token.length;
        return result;
    } catch (e) {
        console.error(e);
        return({e: "error: reading logs failed"});
    }
}

async function readTokenDistribution() {
    try {
        //match documents, extract specific fields, then do some operations on those fields and return
        let count = await db.collection("users").aggregate([ 
            // matches all documents in our collection
            { $match: { _id: { $exists: true } } },
            // extract username and the amount of tokens - leave out _id
            { $project: {_id: 0, username: 1, tokens: { $toString: {$size: "$tokens"} } } }
            // put these into an array (does not work without - no idea why)
        ]).toArray();

        return count;
    } catch(e) {
        console.error(e);
        return({e: "error reading token distribution"});
    }
}

async function readTokenCount() {
    try {
        let result = await db.collection("tokens").countDocuments({});
        return result;
    } catch(e) {
        console.error(e);
        return({e: "error reading token count"});
    }
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//..........................................................UPDATE_FUNCTIONS.......................................................//
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//Update operation **Needs input validation**
async function updateUser(userid,parameter,data) {
    let oid = new ObjectId(userid);
    try {
        await db.collection("users").updateOne(
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

//OBS: Delete user operation (curently only supports deleting own user. May be changed for admin panel)
async function deleteUser(userId) {
    try {
        let oid = new ObjectId(userId);
        await db.collection("users").deleteOne({_id: oid});  
        return true;  
    } catch(e) {
        console.error(e);
        return e;
    }
}

async function deleteToken(userId, tokenArr) {
    try {
        await db.collection("tokens").deleteOne({ _id: tokenArr[0] });
       await db.collection("users").updateOne(
            {_id: userId},
            { $pull: { tokens: { $eq: tokenArr[0]}, $slice: 1} }
        );

        let result = tokenArr.slice(1)
        return result.length;
    } catch(e) {
        console.error(e);
        return e;
    }
}



module.exports = {
    createUser, createTokens, createLogEntry, readUser, readLog, deleteUser, deleteToken, updateUser, readall, readTokenDistribution, readTokenCount
};