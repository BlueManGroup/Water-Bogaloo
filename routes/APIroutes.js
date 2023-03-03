const router = require('express').Router();
const {create, del, read, update} = require('../DB/connection');

////////////////////////////////
//Frontpage
router.post('/signup', (req, res) =>{
    
    const data = req.body;
    
    create('users', data);
   

    //Database query goes here
    res.send("account created");
});

router.get('/login', (req, res) =>{
    
    const data = req.body;
    
    //Database query goes here

    res.send("data received");
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

module.exports = router;