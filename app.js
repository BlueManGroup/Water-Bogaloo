//import dependencies and modules
require('dotenv').config()
const express = require('express')


//enable modules
const app = express();
app.use(express.json())
app.use(express.urlencoded({ extended: false }));

//setup variables from .env
const PORT = process.env.PORT || 3000


//setup routers
const BaseURL = require('./routes/APIroutes')
app.use('/', BaseURL)

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));

