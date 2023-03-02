const router = require('express').Router();
const {update,read} = require('../DB/connection')

router.post('/logout', (req, res) =>{
    
    const data = req.body
    
    //Database query goes here

    res.send("data received")
});

router.post('/updatePassword', (req, res) =>{
    data = req.body

    if (data.password_old === read("users",data._id,"password")) {
        update("users",data._id,"password",data.password_new)
    } else {
        throw new Error("invalid password")
    }
});

module.exports = router