const { readUser } = require('../DB/connection');
const { verifyAndDecodeToken } = require('./JWT');


const verifyUser = async (token) => {
    try {
        let decodedToken = verifyAndDecodeToken(token);
        if (!decodedToken) {
            console.log("decode")
            return ({
                success: false,
                response: "invalid token"
            });
        }
        const result = await readUser( { userid: decodedToken.userId }, {} );
        if (!result) {
            console.log("read")
            return({
                success: false,
                response: "error reading user"
            });
        }
        return({
            success: true,
            response: result
        });
    } catch(e) {
        console.error(e);
        return null;
    }
}

const checkStr = (toCheck) => {
    if (typeof(toCheck) !== 'string') {
        return false;
    }
    return sanitizeInput(toCheck);
}

const checkObj = (toCheck) => {
    if (typeof(toCheck) !== 'object') {
        return false;
    }

    for (let item of Object.keys(toCheck)) {
        if (typeof(toCheck[item]) !== 'string') {
            return false;
        }
        toCheck[item] = sanitizeInput(toCheck[item]);
    }
    return toCheck;
}

const sanitizeInput = (toSanitize) => {
    // check string for regexp matches in the whole string and replace with _
    // replace the following characters: \ $ " ' { }
    // to add to list, do backslash before character
    return toSanitize.replace(/[\\\$\"\'\{\}\<\>\(\)\;]/g, '_');
}

module.exports = {
    verifyUser, checkStr, checkObj
}