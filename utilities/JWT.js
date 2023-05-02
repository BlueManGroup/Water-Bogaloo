const { sign, verify, decode } = require("jsonwebtoken");

const secret = process.env.TOKENSECRET

const createToken = (user) => {
    // create token with following parameters and return
    try {
        let token = sign(
            {userId: user._id, username:user.username},
            secret,
            {expiresIn:"1h"}
            
        );
        return token
    } catch (e) {
        console.error(e)
        return
    }
    
}

const verifyAndDecodeToken = (token) => {
    try {
        if (!verify(token, secret)) {
            return null;
        }
        let decodedToken = decode(token, secret);

        return decodedToken;
    } catch(e) {
        console.error(e);
        return null;
    }
    
}

module.exports = { 
    createToken,
    verifyAndDecodeToken
 }