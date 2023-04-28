const crypto = require('crypto');

const salt = process.env.SALT;

const hashPassword = (password) => {
    if (typeof(password) !== 'string') {
        return 
    }

    let passWithSalt = password.split("")
    passWithSalt.splice(passWithSalt.length/2, 0, salt);
    passWithSalt = passWithSalt.join("");
    let hashedPass = crypto.createHash('sha256')
        .update(passWithSalt, 'utf8')
        .digest('hex');

    return hashedPass;  
}


module.exports = {
    hashPassword
}