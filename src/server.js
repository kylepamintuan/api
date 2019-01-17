const bodyParser = require('body-parser');
const express = require('express');
const bcrypt = require('bcrypt');
const webToken = require('jsonwebtoken');
const mongoUtility = require('./utilities/mongo.utility');

const app = express();
const mongoConnection = mongoUtility.connect('development');

let db;

// Connect to DB
mongoConnection
    .then((conn) => {
        console.log('connected to db');
        db = conn;
    })
    .catch((err) => {
        console.log(err);
    });

// Middlewares
app.use(bodyParser.json());
app.use((req, res, next) => {
    req.db = db;
    return next();
})
app.use(function (req, res, next) {
    res.set({
        'Access-Control-Allow-Origin': '*'
    })
    return next();
});

// Enable Cross-Origin Resource Sharing (CORS)
app.options('*', (req, res) => {
    res.set({
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Access-Control-Request-Headers, Content-Type'
    })
    return res.send('okay');
});

// HTTP Requests
app.post("/api/registration", (req, res) => {
    console.log('PAYLOAD:', req.body);
    let newUser = req.body;
    
    let feedback = {
        success: true,
        message: 'user added successfully'
    };

    req.db
    .collection('users')
    .findOne({ "username": newUser.username })
    .then(
        (usernameTaken) => {
            if(usernameTaken) {
                console.log('MONGO: username already exists');
                feedback.success = false;
                feedback.message = 'username is taken';
        
                return res
                .status(400)
                .json(feedback);
            }
            else {
                bcrypt
                .hash(newUser.password, 10)
                .then(
                    (hash) => {
                        newUser.password = hash;
                        req.db
                        .collection('users')
                        .insertOne(newUser)
                        .then(
                            (result) => {
                                console.log(`MONGO: ${result.toString()}`);
                                return res.json(feedback);
                            }
                        )
                        .catch(
                            (err) => {
                                console.log(err);
                                return res
                                .status(500)
                                .json(err);
                            }
                        );
                    }
                );
            }
        }
    )
    .catch(
        (err) => {
            console.log(err);
            return res
            .status(500)
            .json(err);
        }
    );
});

app.post("/api/login", (req, res) => {
    console.log('PAYLOAD:', req.body);
    let {username, password} = req.body;

    let feedback = {
        success: true,
        message: 'login successful'
    };

    req.db
    .collection('users')
    .findOne({ "username": username })
    .then(
        (userFound) => {
            if(userFound) {
                console.log('MONGO: user found');
                bcrypt
                .compare(password, userFound.password)
                .then(
                    (userVerified) => {
                        if(userVerified) {
                            console.log('MONGO: user verified');
                            feedback.token = webToken.sign({username}, 'cytellix', {expiresIn: '1hr'});
                            return res.json(feedback);
                        }
                        else {
                            console.log('MONGO: user NOT verified');
                            feedback.success = false;
                            feedback.message = 'login unsuccessful';

                            return res
                            .status(400)
                            .json(feedback);
                        }
                    }
                )
            }
            else {
                console.log('MONGO: user NOT found');
                feedback.success = false;
                feedback.message = 'user does not exist';
        
                return res
                .status(400)
                .json(feedback);
            }
        }
    )
    .catch(
        (err) => {
            console.log(err);
            return res
            .status(500)
            .json(err);
        }
    );
});

app.get("/api/reauthorize", (req, res) => {
    let feedback = {
        authorized: true,
        message: 'token verified'
    };

    // verify token
    console.log('REAUTHORIZE:', req.body);

    return res.json(feedback);
});

app.get("/api/user-profile", (req, res) => {
    res.send('user profile');
});

app.get('/', function(req, res) {
    res.send('hello world!');
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
})