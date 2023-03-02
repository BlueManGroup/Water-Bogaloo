const router = require('express').Router();
const {create,read} = require('../DB/connection')


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




router.get('/read',(req, res) =>{
    
    const data = req.body
    read('users', data)

    //database query goes here
    console.log(data)
    res.send("data received")    
});

module.exports = router;