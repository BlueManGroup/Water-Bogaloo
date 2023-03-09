const { sign, verify } = require("jsonwebtoken");

const secret = process.env.TOKENSECRET

const createToken = (user) => {
    // create token with following parameters and return
    const token = sign(
        {userId: user._id, username:user.username},
        secret,
        {expiresIn:"1h"}
    )
    return token
}

const verifyToken = (token) => {
    // verify token and assign to variable
    let verification = verify(token, secret);

    // return true or false based on whether or not the token was validated
    return verification ? true : false;
}

module.exports = { 
    createToken, 
    verifyToken
 }