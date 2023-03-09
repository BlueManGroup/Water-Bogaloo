const router = require('express').Router();
const {create, del, read, update} = require('../DB/connection');
const jwt = require("../Tokens/JWT")
require('dotenv').config()

var ObjectId = require('mongodb').ObjectId;


////////////////////////////////
//Frontpage
router.post('/signup', async (req, res) =>{
    const data = req.body;
    
    // create user
    const user = await create('users', data);

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
    const coll = "users"
    let user

    // checke if user exists
    try {
        user = await read(coll,data,fields)    
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
    }
    let result
    try{
        result = await read("users",userObj,{"password": 1});
    } catch(e) {
        console.error(e)
        res.json({
            status: "Error: failed to update password"
        })
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
        const coll = 'users';
        del(coll, data);
        
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
        const coll = 'users';
        const userFields = {tokens:1,username:1}
        
        const userdata = await read(coll,data,userFields)
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

module.exports = router;