const MongoClient = require('mongodb').MongoClient;

const url = 'mongodb://localhost:27017';

const connect = (dbName = 'development') => {
    return new Promise(function(resolve, reject) {
        MongoClient.connect(url, function(err, client) {
            if (err) {
                return reject(err);
            }
            else {
                return resolve(client.db(dbName));
            }
        });
    });
}

module.exports = { 
    connect: connect
};