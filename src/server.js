const bodyParser = require('body-parser');
const express = require('express');
const bcrypt = require('bcrypt');
const mongoUtility = require('./utilities/mongo.utility');
const tokenUtility = require('./utilities/token.utility');

const app = express();
const mongoConnection = mongoUtility.connect('development');

let db;

mongoConnection
    .then((conn) => {
        console.log('connected to db');
        db = conn;
    })
    .catch((err) => {
        console.log(err);
    });

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

app.options('*', (req, res) => {
    res.set({
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Access-Control-Request-Headers, Content-Type, Authorization'
    })
    return res.send('CORS preflight request received');
});

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
                                return res
                                .status(201)
                                .json(feedback);
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

app.get("/api/login", (req, res) => {
    // console.log('Authorization:', req.headers.authorization);
    let authHeader = req.headers.authorization;

    let feedback = {
        success: true,
        message: 'login successful'
    };

    let basicRegex = /Basic/gm;

    if (authHeader && authHeader.search(basicRegex) > -1) {
        let encodedMsg = authHeader.slice(6, authHeader.length);
        let userPass = base64DecodeUnicode(encodedMsg);
        let [ username, password ] = userPass.split(':');

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
                                feedback.token = tokenUtility.create({username}, 'cytellix', {expiresIn: '1hr'});
                                
                                return res
                                .status(200)
                                .json(feedback);
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
    }
    else {
        feedback.success = false;
        feedback.message = 'Invalid authorization header';

        res.set('WWW-Authenticate', 'Basic realm="user profile"');

        return res
        .status(401)
        .json(feedback);
    }
});

app.get("/api/reauthorize", (req, res) => {
    // console.log('Authorization:', req.headers.authorization);
    let authHeader = req.headers.authorization;

    let feedback = {
        authorized: true,
        message: 'token verified'
    };

    let bearerRegex = /Bearer/gm;

    if (authHeader && authHeader.search(bearerRegex) > -1) {
        let token = authHeader.slice(7, authHeader.length);

        tokenUtility
        .decode(token, 'cytellix')
        .then(
            (decoded) => {
                console.log('TOKEN: verified');
                feedback.username = decoded.username;

                return res
                .status(200)
                .json(feedback);
            }
        )
        .catch(
            (error) => {
                console.log(`JWT: ${error.name} -- ${error.message}`);
                feedback.authorized = false;
                feedback.message = 'token could not be verified';

                res.set('WWW-Authenticate', `Bearer realm="user_profile", error="invalid_token", error_description="${error.message}"`);
    
                return res
                .status(401)
                .json(feedback);
            }
        );
    }
    else {
        feedback.success = false;
        feedback.message = 'Invalid authorization header';

        res.set('WWW-Authenticate', 'Bearer realm="user_profile"');

        return res
        .status(401)
        .json(feedback);
    }
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

function base64DecodeUnicode(str) {
    return decodeURIComponent(Buffer.from(str, 'base64').toString());
}