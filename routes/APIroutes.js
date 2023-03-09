const router = require('express').Router();
const {create, del, read, update} = require('../DB/connection');
const jwt = require("../Tokens/JWT")
require('dotenv').config()


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
    }

    let token;
    // check if username and password is correct
    if (user.username == data.username && user.password == data.password) {
        try {
            token = jwt.createToken(user);
        } catch (e) {
            console.error(e);
        }
        //respond with json telling client login was A-OK
        res.json({
            Success: true,
            data: {
                _id: user._id,
                username: user.username,
                token: token
            }    
        });
    }
});

////////////////////////////////
//Account routes
router.post('/account/updatePassword', async(req, res) =>{
    data = req.body;
    result = await read("users",data.userid,"password");

    // if user input correct old password, change it to the new one
    if (data.password_old == result.password) {
        update("users",data.userid,"password",data.password_new);
        res.send("password changed");
    } else {
        throw new Error("invalid password")
    }
});

router.post('/account/delete', (req, res) =>{
    
    const data = req.body;
    try {
        //update coll to take from data instead of being hardcoded
        const coll = 'users';
        del(coll, data);
        
        res.send("account deleted");
    }
    catch(e) {
        console.error(e);
    }
});

router.post('/account/info', async(req, res) => {

    const data = req.body;
    try {
        // read account info // select what fields to read from mongo document
        const coll = 'users';
        const userFields = {tokens:1,username:1}
        
        const userdata = await read(coll,data,userFields)
        res.send(userdata)
    } catch(e) {
        console.error(e);
    }
});

module.exports = router;