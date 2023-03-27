const { sign, verify, decode } = require("jsonwebtoken");

const secret = process.env.TOKENSECRET

const createToken = (user) => {
    // create token with following parameters and return
    try {
        const token = sign(
            {userId: user._id, username:user.username},
            secret,
            {expiresIn:"1h"}
            
        )
        return token
    } catch (e) {
        console.error(e)
        return
    }
    
}

const verifyToken = (token) => {
    // verify token and assign to variable
    try {
        let verification = verify(token, secret);
    } catch (e) {
        console.error(e)
        return false
    }
    // return true or false based on whether or not the token was validated
    return verification ? true : false;
}

const decodeToken = (token) => {
    try {
        let decodedToken = decode(token);
        return decodedToken
    } catch (e) {
        console.error(e)
        return
    }
} 

module.exports = { 
    createToken, 
    verifyToken,
    decodeToken
 }