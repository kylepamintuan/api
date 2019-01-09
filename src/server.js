const bodyParser = require('body-parser');
const express = require('express');
const mongo = require('mongodb');
const mongoUtility = require('./utilities/mongo.utility');

const app = express();
const mongoConnection = mongoUtility.connect('development');

let db;

mongoConnection
    .then((conn) => {
        console.log('connected');
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
    console.log(req.body);
    console.log(!!req.db); // true if db connection exists
    
    let output = {
        success: true,
        requestData: req.body
    };

    return res.json(output);
});

app.post("/api/login", (req, res) => {
    res.send('login');
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