const router = require('express').Router();
const {createUser, createTokens, readUser, deleteUser, deleteToken, updateUser, readall} = require('../DB/connection');
const jwt = require("../Tokens/JWT")
require('dotenv').config()

var ObjectId = require('mongodb').ObjectId;


////////////////////////////////
//Frontpage
router.post('/signup', async (req, res) =>{
    const data = req.body;
    
    // create user
    const user = await createUser(data);

    // return string based on whether or not account was created
    let resStr
    let token
    if(user) {
        resStr = "account created";
        token = jwt.createToken(user);  
    } else {
        resStr = "user already exists";
    }
    
    res.json({
        response: resStr,
        token: token
    });    
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
            status: "Error: Check username or password"
        })
        return
    }

    let token;
    // check if username and password is correct
    if (user.username == data.username && user.password == data.password) {
        try {
            token = jwt.createToken(user);
            //respond with json telling client login was A-OK 
            res.json({
                Success: true,
                data: {
                    _id: user._id,
                    username: user.username,
                    token: token
                }
        })  
        } catch (e) {
            console.error(e);
            res.json({
                status: "Error: failed to create user"
            })
        }
        //respond with json telling client login was A-OK  
        
    }
});



////////////////////////////////
//Account routes, needs token validation to be used
router.post('/account/updatePassword', async(req, res) =>{
    data = req.body;

    if(!jwt.verifyToken(data.token)) {
        res.json({
            validToken: false
        })
        return
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
            status: "Error: failed to update password"
        });
    }

    // if user input correct old password, change it to the new one
    if (data.password_old == result.password) {
        try {
            update("users",user.userId,"password",data.password_new);
        
            res.json({
                validToken: true,
                status: "password changed"
            });
        } catch(e) {
            res.json({
                validToken: true,
                status: "error changing password"
            });
        }
        
    } else {
        res.json({
            validToken: true,
            status: "invalid password"
        });
    }
});

router.post('/account/delete', (req, res) =>{
    
    const data = req.body;
    
    if (!jwt.verifyToken(data.token)) {
        res.json({
            validToken: false
        });
        return;
    }

    try {
        //update coll to take from data instead of being hardcoded
        userId = jwt.decodeToken(data.token).userId;
        deleteUser(userId);
        
        res.json({
            validToken: true,
            status: "account deleted"
        });
    }
    catch(e) {
        res.json({
            validToken: true,
            status: "Error"
        })
    }
});

router.post('/account/info', async(req, res) => {

    const data = req.body;
    
    if(!jwt.verifyToken(data.token)) {
        res.json({
            validToken: false
        });
        return;
    }
    
    try {
        // read account info // select what fields to read from mongo document
        const userFields = {tokens:1,username:1}
        
        const userdata = await readUser(data,userFields)
        res.json({
            validToken: true,
            status: "Read completed",
            username: userdata.username,
            tokens: userdata.tokens
        })
    } catch(e) {
        res.json({
            validToken: true,
            status: "error reading account info"
        });
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
            validToken: false,
            status: "invalid token"
        });
        return;
    }

    let decodedToken = jwt.decodeToken(data.token);
    let initiatorObj = await readUser({username: decodedToken.username}, {role:1});
    let userObj = await readUser({username: data.username}, {role:1, username:1});
    //Catch errors
    if(!(initiatorObj.role == "director")) {
        res.json({
            validRole: false,
            status: "insufficient rights"
        });
        return;
    }   

    if(userObj.role == data.updatedRole) {
        res.json({
            status: "User already has this role"
        });
        return;
    }

    if(!await update(coll,userObj._id,"role",data.updatedRole)) {
        res.json({
            status: "success"
        });
        return;
    } else {
        res.json({
            status: "error updating role"
        });
        return;
    }


}
)
router.post('/director/showall', async (req,res) => {
    const data = req.body;
    const userFields = {username:1,role:1};
    let decodedToken = jwt.decodeToken(data.token);

    if(!jwt.verifyToken(data.token)) {
        res.json({
            validToken: false,
            status: "invalid token"
        });
        return;
    }

    let initiatorObj = await readUser({username: decodedToken.username}, {role:1});

    if(!(initiatorObj.role == "director")) {
        res.json({
            validToken: true,
            validRole: false,
            status: "insufficient rights"
        });
        return;
    }  

    let result = await readall("users", userFields);
    res.json(result);

})


//TOKEN ROUTES¨
// initiator users jwt
// receivers username
// amount of tokens
router.post('/tokens/create', async (req, res) => {
    const data = req.body;
    
    // check if jwt still valid
    if(!jwt.verifyToken(data.token)) {
        res.json({
            validToken: false,
            status: "invalid token",
        });
        return;
    }

    // check if initiating user is director
    let decodedToken = jwt.decodeToken(data.token);
    let initObj = await readUser({username: decodedToken.username}, {role: 1});
    if(!(initObj.role == "director")) {
        res.json({
            validRole: false,
            status: "invalid token"
        });
        return;
    }

    let result = await createTokens(data.username, data.amount);
    res.json({result});
});

router.post('/tokens/redeem', async(req, res) => {
    const data = req.body;
    
    if(!jwt.verifyToken(data.token)) {
        res.json({
            validToken: false,
            status: "invalid token"
        });
        return;
    } 

    let decodedToken = jwt.decodeToken(data.token);
    let userObj = await readUser({username: decodedToken.username}, {_id: 1, tokens: 1})
    if (userObj.tokens.length < 1) {
        res.json({
            moreThanZeroTokens: false,
            status: "User has no drink tokens"
        });
        return;
    }

    let result = await deleteToken(userObj._id, userObj.tokens);
    res.json({result});
});

module.exports = router;