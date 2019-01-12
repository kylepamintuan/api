const bodyParser = require('body-parser');
const express = require('express');
const mongoUtility = require('./utilities/mongo.utility');

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
        'Access-Control-Allow-Headers': 'Access-Control-Request-Headers, Content-Type'
    })
    return res.send('okay');
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
});

app.post("/api/login", (req, res) => {
    console.log('PAYLOAD:', req.body);
    let possibleUser = req.body;

    let feedback = {
        success: true,
        message: 'login successful'
    };

    req.db
        .collection('users')
        .findOne(possibleUser)
        .then((userFound) => {
            if(userFound){
                console.log('MONGO: user verified');
                return res.json(feedback);
            }
            else{
                console.log('MONGO: user NOT verified');
                feedback.success = false;
                feedback.message = 'login unsuccessful'

                return res
                .status(401)
                .json(feedback);
            }
        })
        .catch((e) => {
            console.log(e);

            return res.status(500).json(e);
        });
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