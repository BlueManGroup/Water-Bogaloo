const router = require('express').Router();
const {createUser, createTokens, createLogEntry, readUser, readLog, deleteUser, deleteToken, updateUser, readall} = require('../DB/connection');
const jwt = require("../Tokens/JWT")
require('dotenv').config()

var ObjectId = require('mongodb').ObjectId;


////////////////////////////////
//Frontpage
router.post('/signup', async (req, res) =>{
    const data = req.body;

    // create user
    const user = await createUser(data);

    if (!user) {
        res.json({
            success: false,
            response: "user already exists",
        })
        return;
    }
    let token = jwt.createToken(user);  
    
    res.json({
        success: true,
        response: "account created",
        token: token,
    });
    return;
});

router.post('/login', async (req, res) =>{
    const data = req.body;
    const fields = {username:1,password:1}
    let user

    // checke if user exists
    try {
        user = await readUser(data, fields)    
    } catch(e) {
        console.error(e);
        res.json({
            success: false,
            response: "invalid username or password"
        })
        return;
    }

    let token;
    // check if password is correct
    if (user.password == data.password) {
        try {
            token = jwt.createToken(user);
            //respond with json telling client login was A-OK 
            res.json({
                success: true,
                data: {
                    _id: user._id,
                    username: user.username,
                    token: token
                }
        });
        return;
        } catch (e) {
            console.error(e);
            res.json({
                success: false,
                response: "error: failed to create user"
            });
            return;
        }        
    }
});



////////////////////////////////
//Account routes, needs token validation to be used
router.post('/account/updatePassword', async(req, res) =>{
    data = req.body;

    if(!jwt.verifyToken(data.token)) {
        res.json({
            success: false,
            response: "invalid token"
        });
        return;
    }

    let user = await jwt.decodeToken(data.token);

    let userObj = {
        "username": user.username,
        "userid": user.userId
    };
    let result;
    try{
        result = await readUser(userObj,{"password": 1});
    } catch(e) {
        console.error(e)
        res.json({
            success: false,
            response: "error updating password"
        });
    }

    // if user input correct old password, change it to the new one
    if (data.password_old == result.password) {
        try {
            updateUser(user.userId,"password",data.password_new);
        
            res.json({
                success: true,
                response: "password changed"
            });
            return;
        } catch(e) {
            res.json({
                success: false,
                response: "error changing password"
            });
            return;
        }
        
    } else {
        res.json({
            success: false,
            status: "invalid password"
        });
        return;
    }
});

router.post('/account/delete', (req, res) =>{
    
    const data = req.body;
    
    if (!jwt.verifyToken(data.token)) {
        res.json({
            success: false,
            response: "invalid token"
        });
        return;
    }

    try {
        //update coll to take from data instead of being hardcoded
        userId = jwt.decodeToken(data.token).userId;
        deleteUser(userId);
        
        res.json({
            success: true,
            response: "account deleted"
        });
    }
    catch(e) {
        res.json({
            success: true,
            response: "error deleting account"
        })
    }
});

router.post('/account/info', async(req, res) => {

    const data = req.body;
    
    if(!jwt.verifyToken(data.token)) {
        res.json({
            success: false,
            response: "invalid token"
        });
        return;
    }
    
    try {
        // read account info // select what fields to read from mongo document
        const userFields = {tokens:1,username:1}
        
        const userdata = await readUser(data,userFields)
        res.json({
            success: true,
            response: "account info read",
            username: userdata.username,
            tokens: userdata.tokens
        })
    } catch(e) {
        res.json({
            success: true,
            response: "error reading account info"
        });
    }
});

// fetch all logs about the user themselves
router.post('/account/log', async (req, res) => {
    const data = req.body;

    if(!jwt.verifyToken(data.token)) {
        res.json({
            success: false,
            response: "invalid token"
        });
        return;
    }

    let decodedToken = jwt.decodeToken(data.token);
    try {
        let queryObj = {
            dateEnd: data.dateEnd,
            dateStart: data.dateStart,
            action: data.action,
            receiver: decodedToken.username,
            initiator: decodedToken.username
        }
        let result = await readLog(queryObj);
    
        res.json({
            success: true,
            response: result
        });
        return;
    } catch (e) {
        res.json({
            success: false,
            response: "error reading logs"
        });
        return;
    }
    
});


//###################################################
//User rights Routes:

//show user rights:

//update user role:
router.post('/director/updateuserrole', async(req,res) => {
    const data = req.body;
    
    //Token validation
    if(!jwt.verifyToken(data.token)) {
        res.json({
            success: false,
            response: "invalid token"
        });
        return;
    }

    let decodedToken = jwt.decodeToken(data.token);
    let initiatorObj = await readUser({username: decodedToken.username}, {role:1});
    let userObj = await readUser({username: data.username}, {role:1, username:1});
    //Catch errors
    if(!(initiatorObj.role == "director")) {
        res.json({
            success: false,
            response: "insufficient rights"
        });
        return;
    }   

    if(userObj.role == data.updatedRole) {
        res.json({
            success: false,
            response: "user already has this role"
        });
        return;
    }

    if(!await updateUser(userObj._id,"role",data.updatedRole)) {
        let logObj = {
            date: null,
            action: "change user rights",
            userObj: {
                initiator: decodedToken.username,
                receiver: data.username,
            },
            role: data.updatedRole
        }

        await createLogEntry(logObj);
        res.json({
            success: true,
            response: "user's role successfully changed"
        });
        return;
    } else {
        res.json({
            success: false,
            response: "error updating role"
        });
        return;
    }


});

router.post('/director/showall', async (req,res) => {
    const data = req.body;
    const userFields = {username:1,role:1};
    let decodedToken = jwt.decodeToken(data.token);

    if(!jwt.verifyToken(data.token)) {
        res.json({
            success: false,
            response: "invalid token"
        });
        return;
    }

    let initiatorObj = await readUser({username: decodedToken.username}, {role:1});

    if(!(initiatorObj.role == "director")) {
        res.json({
            success: false,
            response: "insufficient rights"
        });
        return;
    }  


    let result = await readall("users", userFields);
    
    res.json({
        success: true,
        data: result
    });

});

router.post('/director/log', async (req, res) => {
    const data = req.body;

    if(!jwt.verifyToken(data.token)) {
        res.json({
            success: false,
            response: "invalid token"
        });
        return;
    }

    let decodedToken = jwt.decodeToken(data.token);
    let userObj = await readUser({username: decodedToken.username}, {role:1}); 
    if (!(userObj.role == "director")) {
        res.json({
            success: false,
            response: "insufficient rights"
        });
        return;
    }

    try {
        let queryObj = {
            dateEnd: data.dateEnd,
            dateStart: data.dateStart,
            action: data.action,
            receiver: data.receiver,
            initiator: data.initiator
        }
        let result = await readLog(queryObj);
    
        res.json({
            success: true,
            response: result
        });
        return;
    } catch (e) {
        res.json({
            success: false,
            response: "error reading logs"
        });
        return;
    }

})
//////////////////////////////////////////////////
// Drink tokens

//TOKEN ROUTES¨
// initiator users jwt
// receivers username
// amount of tokens
router.post('/tokens/create', async (req, res) => {
    const data = req.body;
    
    // check if jwt still valid
    if(!jwt.verifyToken(data.token)) {
        res.json({
            success: false,
            status: "invalid token",
        });
        return;
    }

    // check if initiating user is director
    let decodedToken = jwt.decodeToken(data.token);
    let initObj = await readUser({username: decodedToken.username}, {role: 1});
    if(!(initObj.role == "director")) {
        res.json({
            success: false,
            response: "insufficient rights"
        });
        return;
    }

    let result = await createTokens(data.username, data.amount);
    let logObj = {
        date: null,
        action: "distribute",
        userObj: {
            initiator: decodedToken.username,
            receiver: data.username
        },
        tokens: result
    }
    await createLogEntry(logObj);
    res.json({result});
});

router.post('/tokens/redeem', async(req, res) => {
    const data = req.body;
    
    if(!jwt.verifyToken(data.token)) {
        res.json({
            success: false,
            response: "invalid token"
        });
        return;
    } 

    let decodedToken = jwt.decodeToken(data.token);
    let userObj = await readUser({username: decodedToken.username}, {_id: 1, tokens: 1});
    if (userObj.tokens.length < 1) {
        res.json({
            success: false,
            response: "User has no drink tokens"
        });
        return;
    }

    let result = await deleteToken(userObj._id, userObj.tokens);
    // edit object for logging
    let logObj =  { 
        date: null,
        action: "redeem",
        userObj: {
            initiator: decodedToken.username
        }
    }
    await createLogEntry(logObj);
    res.json({result});
});

module.exports = router;