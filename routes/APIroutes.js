const router = require('express').Router();
const {create, del, read} = require('../DB/connection')


router.post('/signup', (req, res) =>{
    
    const data = req.body
    
    create('users',data)
   

    //Database query goes here
    console.log(data)
    res.send("data received")
});

router.get('/login', (req, res) =>{
    
    const data = req.body
    
    //Database query goes here

    res.send("data received")
});



router.post('/delete', (req, res) =>{
    
    const data = req.body;
    console.log(data);
    
    try {
        //update coll to take from data instead of being hardcoded
        const coll = 'users';
        del(coll, data);
        
        res.send("data received");
    }
    catch(e) {
        console.error(e);
    }
});

router.get('/read',(req, res) =>{
    
    const data = req.body
    read('users', data)

    //database query goes here
    console.log(data)
    res.send("data received")    
});

module.exports = router;