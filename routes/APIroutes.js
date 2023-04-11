const router = require('express').Router();
const {create, del, read,readall, update} = require('../DB/connection');
const jwt = require("../Tokens/JWT")
require('dotenv').config()

var ObjectId = require('mongodb').ObjectId;


////////////////////////////////
//Frontpage
router.post('/signup', async (req, res) =>{
    const data = req.body;
    
    // create user
    const user = await create('users', data);

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
    const coll = "users";
    let user;

    // checke if user exists
    try {
        user = await read(coll,data,fields);  
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
        result = await read("users",userObj,{"password": 1});
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
            update("users",user.userId,"password",data.password_new);
        
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
        const coll = 'users';
        del(coll, data);
        
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
        const coll = 'users';
        const userFields = {tokens:1,username:1}
        
        const userdata = await read(coll,data,userFields)
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


//###################################################
//User rights Routes:

//show user rights:

//update user role:
router.post('/director/updateuserrole', async(req,res) => {
    const data = req.body;
    let coll = 'users';
    
    //Token validation
    if(!jwt.verifyToken(data.token)) {
        res.json({
            success: false,
            response: "invalid token"
        });
        return;
    }

    let decodedToken = jwt.decodeToken(data.token);
    let initiatorObj = await read(coll,{username: decodedToken.username},{role:1});
    let userObj = await read(coll,{username: data.username},{role:1, username:1});
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

    if(!await update(coll,userObj._id,"role",data.updatedRole)) {
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


}
)
router.post('/director/showall', async (req,res) => {
    const data = req.body
    const coll = "users"
    const userFields = {username:1,role:1}
    let decodedToken = jwt.decodeToken(data.token)

    if(!jwt.verifyToken(data.token)) {
        res.json({
            success: false,
            response: "invalid token"
        });
        return;
    }

    let initiatorObj = await read(coll,{username: decodedToken.username},{role:1});

    if(!(initiatorObj.role == "director")) {
        res.json({
            success: false,
            response: "insufficient rights"
        });
        return;
    }  

    let result = await readall(coll,userFields)
    res.json(result);

})

module.exports = router;