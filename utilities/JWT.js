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

const  verifyToken = async (token) => {
    // validation check on token
    let verification;
    try {

        verification = verify(token, secret);

    } catch (e) {
        console.error(e)
        verification = false;
    }

    //verification of user identity
    let user = await decodeToken(data.token);

    let userObj = {
        "userid": user.userId
    };
    let result;
    let role = "user" 
    try{
        result = await readUser(userObj);
        if (result != null) {
            verification = true;
            role = result.role
        } else {
            verification = false;
        }
    } catch(e) {
        console.error(e)
        verification = false;
    }

    // return true or false based on whether or not the token was validated
    return {
        verification: verification,
        role: role
    }

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