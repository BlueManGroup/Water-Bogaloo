require('dotenv').config()

const express = require('express')
const bodyParser = require('body-parser')
const app = express();

//setup subfolders
const APIroutes = require('./routes/APIroutes')

//setup variables. should be changed to a local config
const PORT = process.env.PORT || 3000

//express packages
app.use(bodyParser.json())
app.use(express.urlencoded({ extended: false }));

//routes
app.use('/', APIroutes)


app.listen(PORT, () => console.log(`Listening on port ${PORT}`));