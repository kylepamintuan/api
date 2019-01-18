const jwt = require('jsonwebtoken');

const create = (payload = {}, privateKey = '', options = {}) => {
    return jwt.sign(payload, privateKey, options);
}

const decode = (token = '', privateKey = '') => {
    return new Promise((resolve, reject) => {
        jwt.verify(token, privateKey, (err, decoded) => {
            if(err){
                reject(err);
            }
            else {
                resolve(decoded);
            }
        });
    });
}

module.exports = { 
    create,
    decode
};