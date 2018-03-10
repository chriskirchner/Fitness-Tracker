/**
 * Created by Xaz on 3/2/2016.
 */

/*
 Author: Chris Kirchner
 Organization: OSU
 Class: CS290 Web Development
 Assignment: Week 10 - Database Interactions and UI
 Date: 13Mar16
 Purpose: server-side code for serving fitness track table-form
 */

var express = require('express');
var expressHandlebars = require('express-handlebars');
var bodyParser = require('body-parser');
var mysql = require('mysql');

var app = express();
var handlebars = expressHandlebars.create({defaultLayout: 'main'});
app.engine('handlebars', handlebars.engine);
app.set('port', 3002);
app.set('view engine', 'handlebars');

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use(express.static('public'));

var pool = mysql.createPool({
    host: 'localhost',
    user: 'student',
    password: 'default',
    database: 'student',
    //use data, not datetime
    dateStrings: 'date'
});


app.get('/reset-table',function(req,res,next){
    var context = {};
    pool.query("DROP TABLE IF EXISTS workouts", function(err){
        var createString = "CREATE TABLE workouts("+
            "id INT PRIMARY KEY AUTO_INCREMENT,"+
            "name VARCHAR(255) NOT NULL,"+
            "reps INT,"+
            "weight INT,"+
            "date DATE,"+
            "lbs BOOLEAN)";
        pool.query(createString, function(err){
            context.results = "Table reset";
            res.render('fitness',context);
        })
    });
});

app.get('/fitness', function(req, res){
    var context = {};
    res.render('fitness', context);
});

app.get('/get-fitness', function(req, res, next){
    pool.query("SELECT id, name, reps, weight, date, lbs FROM workouts",
        function(err, rows, fields){
            if (err){
                next(err);
                return;
            }
            res.send(rows);
    });
});

app.post('/insert-fitness', function(req,res,next){
    pool.query("INSERT INTO workouts (name, reps, weight, date, lbs) VALUES (?,?,?,?,?)",
        [req.body.name || null, req.body.reps || null,
            req.body.weight || null, req.body.date || null,
            req.body.lbs || null],
        function(err,result){
            if (err){
                //send error back to client to deal with
                res.send(err);
            }
            else {
                res.send(result);
            }
        });
});

app.post('/delete-fitness', function(req, res){
    pool.query("DELETE FROM workouts WHERE id=?", req.body.id, function(err, result){
        if (err){
            next(err);
            return;
        }
        res.send(result);
    })
});

app.post('/update-fitness', function(req, res, next){
    values = [req.body.name || null, req.body.reps || null, req.body.weight || null,
        req.body.date || null, req.body.lbs || 1, req.body.id];
    //set all values for ease
    query = "UPDATE workouts SET name=?, reps=?, weight=?, date=?, lbs=? " +
    "WHERE id=?";
    pool.query(query, values, function(err, result){
            if (err){
                res.send(err);
                return;
            }
            res.send(result);
    });
});

app.get('/', function(req, res){
    res.status(404);
    res.render('404');
});

app.get('/', function(err, req, res, next){
    console.log(err.stack);
    res.type('plain/text');
    res.status(500);
    res.render('500');
});

app.listen(app.get('port'), function(){
    console.log("Started server on http://localhost:"+app.get('port')+"; Enter Ctrl-C to terminate");
});