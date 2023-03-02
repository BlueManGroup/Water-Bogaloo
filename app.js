//import dependencies and modules
require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')



//enable modules
const app = express();
app.use(bodyParser.json())
app.use(express.urlencoded({ extended: false }));

//setup variables from .env
const PORT = process.env.PORT || 3000


//setup routers
const APIroutes = require('./routes/APIroutes')
app.use('/', APIroutes)

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));