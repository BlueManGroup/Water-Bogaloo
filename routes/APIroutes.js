const router = require('express').Router();
const { createUser, createTokens, createLogEntry, readUser, readLog, deleteUser, deleteToken, updateUser, readall, readTokenDistribution, readTokenCount } = require('../DB/connection');
const { verifyUser, checkObj, checkStr } = require('../utilities/verification');
const { createToken } = require('../utilities/JWT');
const { hashPassword } = require("../utilities/Hash");
require('dotenv').config()

process.on('uncaughtException', function (err) {
    console.error(err);
    console.log("Node NOT Exiting...");
  });

var ObjectId = require('mongodb').ObjectId;


////////////////////////////////
//Frontpage
router.post('/signup', async (req, res) =>{
    const data = req.body;

    if (checkObj(data) === false) {
        res.json({
            success: false,
            reponse: "invalid input"
        });
        return;
    }

    data.password = hashPassword(data.password);

    // create user
    const user = await createUser(data);

    if (user === false) {
        res.json({
            success: false,
            response: "user already exists",
        })
        return;
    }
    let token = createToken(user);  
    
    res.json({
        success: true,
        response: token
    });
});

router.post('/login', async (req, res) =>{
    const data = req.body;
    if (checkObj(data) === false) {
        res.json({
            success: false,
            response: "invalid input"
        });
        return;
    }
    
    data.password = hashPassword(data.password);
    const fields = {username:1,password:1,role:1}
    let user;

    // check if user exists
    try {
        user = await readUser(data, fields);
        if (user == null) throw new Error("invalid user");
    } catch(e) {
        console.error(e);
        res.json({
            success: false,
            response: "invalid username or password",
        })
        return;
    }

    let token;
    // check if password is correct
    if (user.password == data.password) {
        try {
            token = createToken(user);
            //respond with json telling client login was A-OK 
            res.json({
                success: true,
                response: {
                    _id: user._id,
                    username: user.username,
                    role: user.role,
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
    res.json({
        success: false,
        response: "invalid username or password"
    });
});



////////////////////////////////
//Account routes, needs token validation to be used
router.post('/account/updatePassword', async(req, res) =>{
    let data = req.body;
    let result;

    if (checkObj(data) === false) {
        res.json({
            success: false,
            reponse: "invalid input"
        });
        return;
    }

    verifyUserObj = await verifyUser(data.token)
    if (!verifyUserObj.success) {
        res.json(verifyUserObj);
        return;
    }

    try {
        data.password_old = hashPassword(data.password_old);
        data.password_new = hashPassword(data.password_new);

    } catch (e) {
        console.error(e);
        res.json({
            success: false,
            response: "error updating password" //erorr in hashing
        });
        return;
    }
    
    try{
        result = await readUser( { userid: verifyUserObj.response._id } ,{ "password" : 1 } );
    } catch(e) {
        console.error(e)
        res.json({
            success: false,
            response: "error updating password" //error in fetching user
        });
        return;
    }

    // if user input the correct old password, change it to the new one
    if (data.password_old == result.password) {
        try {
            updateUser(verifyUserObj.response._id, "password", data.password_new);
        
            res.json({
                success: true,
                response: "password changed" //sucess
            });
            return;
        } catch(e) {
            console.error(e);
            res.json({
                success: false,
                response: "error updating password" //error updating password
            });
            return;
        }
        
    } else {
        res.json({
            success: false,
            response: "invalid password" //old password didn't match
        });
        return;
    }
});

router.post('/account/delete', async (req, res) =>{
    
    const data = req.body;

    if (checkObj(data) === false) {
        res.json({
            success: false,
            response: "invalid input"
        });
        return;
    }

    let verifyUserObj = await verifyUser(data.token);
    
    if (!(verifyUserObj.success)) {
        res.json(verifyUserObj);
        return;
    }

    try {
        if (!(await deleteUser(verifyUserObj.response._id))) {
            res.json({
                success: false,
                response: "errrrrrrrrror deleting account"
            });
        }
        
        res.json({
            success: true,
            response: "account deleted"
        });
    }
    catch(e) {
        console.error(e);
        res.json({
            success: false,
            response: "error deleting account"
        });
    }
});

router.post('/account/info', async(req, res) => {

    const data = req.body;
    
    if (checkObj(data) === false) {
        res.json({
            success: false,
            reponse: "invalid input"
        });
        return;
    }

    // read account info
    let verifyUserObj = await verifyUser(data.token);
    
    if (!(verifyUserObj.success)) {
        res.json(verifyUserObj);
        return;
    }
    
    // respond with account info
    res.json({
        success: true,
        response: {
            username: verifyUserObj.response.username,
            tokens: verifyUserObj.response.tokens.length
        }
    });
});

// fetch all logs about the user themselves
router.post('/account/log', async (req, res) => {
    const data = req.body;

    if (checkObj(data) === false) {
        res.json({
            success: false,
            reponse: "invalid input"
        });
        return;
    }
    
    let verifyUserObj = await verifyUser(data.token);
    
    if (!(verifyUserObj.success)) {
        res.json(verifyUserObj);
        return;
    }

    
    try {
        let queryObj = {
            dateEnd: data.dateEnd,
            dateStart: data.dateStart,
            action: data.action,
            receiver: verifyUserObj.response.username,
            initiator: verifyUserObj.response.username
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
    
    if (checkObj(data) === false) {
        res.json({
            success: false,
            reponse: "invalid input"
        });
        return;
    }

    //Token validation
    let verifyUserObj = await verifyUser(data.token);
    if(!verifyUserObj.success) {
        res.json(verifyUserObj);
        return;
    }

    
    let initiatorObj = {
        username : verifyUserObj.response.username,
        role : verifyUserObj.response.role
    }
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
                initiator: verifyUserObj.response.username,
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

    if (checkObj(data) === false) {
        res.json({
            success: false,
            reponse: "invalid input"
        });
        return;
    }
    
    let verifyUserObj = await verifyUser(data.token);
    if(!verifyUserObj.success) {
        res.json(verifyUserObj);
        return;
    }

    let initiatorObj = {
        username : verifyUserObj.response.username,
        role : verifyUserObj.response.role
    }

    if(initiatorObj.role != "director" ) {
        res.json({
            success: false,
            response: "insufficient rights"
        });
        return;
    }  


    let result = await readall("users", userFields);
    
    res.json({
        success: true,
        response: result
    });

});

router.post('/director/log', async (req, res) => {
    const data = req.body;

    if (checkObj(data) === false) {
        res.json({
            success: false,
            reponse: "invalid input"
        });
        return;
    }

    let verifyUserObj = await verifyUser(data.token);
    if(!verifyUserObj.success) {
        res.json(verifyUserObj);
        return;
    }

    if (verifyUserObj.response.role != "director") {
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

});

//THIS IS A SHITTY NAME USING SHITTY NAMING CONVENTIONS. REPONSIBLE ALSO HAVE ACCESS TO THIS, BUT AT THIS POINT
// I WON'T CAHNGE IT BECAUSE IT REQUIRES ME TO CHANGE IT IN THE FRONTEND AS WELL AS MANY OTHER ROUTES
router.post('/director/tokens', async (req, res) => {
    const data = req.body;


    if (checkObj(data) === false) {
        res.json({
            success: false,
            reponse: "invalid input"
        });
        return;
    }

    let verifyUserObj = await verifyUser(data.token);
    
    if (!verifyUserObj.success) {
        res.json(verifyUserObj);
        return;
    }

    if (verifyUserObj.response.role != "director" && verifyUserObj.response.role != "responsible" ) {
        res.json({
            success: false,
            response: "insufficient rights"
        });
        return;
    }
    let result = await readTokenDistribution();
    if (result.e) {
        res.json({
            success: false,
            response: "error reading token distribution"
        });
        return;
    }
    res.json({
        success: true,
        response: result
    });
    return;
});


//////////////////////////////////////////////////
// Drink tokens

//TOKEN ROUTES¨
// initiator users jwt
// receivers username
// amount of tokens
router.post('/tokens/create', async (req, res) => {
    const data = req.body;

    if (checkObj(data) === false) {
        res.json({
            success: false,
            reponse: "invalid input"
        });
        return;
    }
    
    // check if jwt still valid
    let verifyUserObj = await verifyUser(data.token);
    
    if(!verifyUserObj.success) {
        res.json(verifyUserObj);
        return;
    }

    // check if initiating user is a director or a responsible
    if(verifyUserObj.response.role != "director" && verifyUserObj.response.role != "responsible") {
        res.json({
            success: false,
            response: "insufficient rights"
        });
        return;
    }

    console.log(data);

    let result = await createTokens(data.username, data.amount);
    let logObj = {
        date: null,
        action: "distribute",
        userObj: {
            initiator: verifyUserObj.response.username,
            receiver: data.username
        },
        tokens: {
            tokenAmount: result.tokens.length,
            tokensArr: result.tokens
        }
    }
    await createLogEntry(logObj);
    res.json({
        success: true,
        response: result.userTokenAmount});
});

router.post('/tokens/redeem', async(req, res) => {
    const data = req.body;

    if (checkObj(data) === false) {
        res.json({
            success: false,
            reponse: "invalid input"
        });
        return;
    }
    
    let verifyUserObj = await verifyUser(data.token);
    
    if (!verifyUserObj.success) {
        res.json(verifyUser);
        return;
    }

    // Check if user has any drink tokens
    if (verifyUserObj.response.tokens.length < 1) {
        res.json({
            success: false,
            response: "User has no drink tokens"
        });
        return;
    }

    let result = await deleteToken(verifyUserObj.response._id, verifyUserObj.response.tokens);
    
    // edit object for logging
    let logObj =  { 
        date: null,
        action: "redeem",
        userObj: {
            initiator: verifyUserObj.response.username
        }
    }

    await createLogEntry(logObj);
    
    res.json({
        success: true,
        response: result
    });
});

router.post('/tokens/count', async(req, res) => {
    const data = req.body;

    if (checkObj(data) === false) {
        res.json({
            success: false,
            reponse: "invalid input"
        });
        return;
    }

    let verifyUserObj = await verifyUser(data.token);
    
    if (!verifyUserObj.success) {
        res.json(verifyUser);
        return;
    }

    if (verifyUserObj.response.role != "director" && verifyUserObj.response.role != "responsible") {
        res.json({
            success: false,
            response: "insufficient rights"
        });
        return;
    }

    let result = await readTokenCount();

    res.json({
        success: true,
        response: result
    });
    return
});

module.exports = router;