const router = require('express').Router();
const {create, del, read, update} = require('../DB/connection');
const jwt = require('jsonwebtoken')
require('dotenv').config()


////////////////////////////////
//Frontpage
router.post('/signup', async (req, res) =>{
    
    const data = req.body;
    
    const what = await create('users', data);
    const resStr = what ? "account created" : "username already exists";
    
    res.send(resStr);    
});

router.post('/login', async (req, res) =>{
    
    const data = req.body;
    const fields = {username:1,password:1}
    const coll = "users"
    let existingUser

    try {
        existingUser = await read(coll,data,fields)    
    } catch(e) {
        console.error(e);
    }
    let token
    if (existingUser.username == data.username && existingUser.password == data.password) {
        try {token = jwt.sign(
                {userId: existingUser._id, username:existingUser.username},
                process.env.TOKENSECRET,
                {expiresIn:"1h"}
            
            )
        } catch (e) {
            console.error(e)
        }

        res.json({
            Success: true,
            data: {
                _id: existingUser._id,
                username: existingUser.username,
                token: token
            }    
        });
    }
});

////////////////////////////////
//Account routes
router.post('/account/logout', (req, res) =>{
    
    const data = req.body;
    
    //Database query goes here

    res.send("data received");
});

router.post('/account/updatePassword', async(req, res) =>{
    data = req.body;
    result = await read("users",data.userid,"password");

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
    // const dobj = {
    //     username: data.username ? data.username : null,
    //     _id: 
    // }

    try {
        //read account info
        const coll = 'users';
        const userFields = {tokens:1,username:1}
        
        const userdata = await read(coll,data,userFields)
        res.send(userdata)
    } catch(e) {
        console.error(e);
    }
});

module.exports = router;