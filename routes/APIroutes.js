const router = require('express').Router();

router.post('/signup', (req, res) =>{
    
    const data = req.body
    
    //Database query goes here
    console.log(data)
    res.send("data received")
});

router.get('/login', (req, res) =>{
    
    const data = req.body
    
    //Database query goes here

    res.send("data received")
});

router.post('/logout', (req, res) =>{
    
    const data = req.body
    
    //Database query goes here

    res.send("data received")
});

router.delete('/delete', (req, res) =>{
    
    const data = req.body
    
    //Database query goes here

    res.send("data received")
});

module.exports = router;