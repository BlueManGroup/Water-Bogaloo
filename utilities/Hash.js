var crypto = require('crypto');

const salt = process.env.SALT;

const hashPassword = (password) => {
    passWithSalt = password.split("")
    passWithSalt.splice(passWithSalt.length/2, 0, salt);
    passWithSalt = passWithSalt.join("");
    hashedPass = crypto.createHash('sha256')
        .update(passWithSalt, 'utf8')
        .digest('hex');

    return hashedPass;  
}


module.exports = {
    hashPassword
}