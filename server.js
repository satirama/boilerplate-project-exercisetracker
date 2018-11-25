const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MONGOLAB_URI, {
  useMongoClient: true
});

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

var schema = new mongoose.Schema({ username: 'string', userage: 'string', excercises: [] });
var excerciseCollection = mongoose.model('excercise', schema);

app.post('/api/exercise/new-user', function(req, res) {
  var user = req.body;
  user.excercises = [];
  console.log(user);

  excerciseCollection.create(user, function (err, result) {
    if (err) 
      res.send({"error": "An error has occurred"});
    else {
      console.log(result);
      res.send(result);}
  });
});

app.get('/api/exercise/users', function(req, res) {
  excerciseCollection.find({}, {username: true, userage: true, _id: false} ,function (err, result) {
    if (err) 
      res.send({"error": "An error has occurred"});
    else {
      console.log(result);
      res.send(result);
    }
  });
});

app.post('/api/exercise/add', function(req, res) {
  var user = req.body;
  var excercise = {
    description: user.description,
    duration: user.duration,
    date: user.date ? new Date(user.date) : new Date()
  };
  excerciseCollection.findByIdAndUpdate(user.userId, {
    $push: {
      "excercises": excercise
    }
  },{
    new: true
  },function(err, result){
    if (err) 
      res.send({"error": "An error has occurred"});
    else {
      console.log(result);
      res.send(result);}
  });
});

app.get('/api/exercise/log', function(req, res) {
  var id = req.query.userId;
  var from = req.query.from;
  var to = req.query.to;
  var limit = req.query.limit;
  console.log(req.query);
  
  if (!id)
    res.send('You need to query a user id');
  else if (from && to) {
    excerciseCollection.findOne({
      _id: id,
      "excercises": { $elemMatch: { "date": {$gt: from, $lte: to} } }
    }, {excercises: true, username: true, userage: true, _id: false}, {lean: true} ,function (err, result) {
      if (err) 
        res.send({"error": "An error has occurred"});
      else {
        result["totalExcercises"] = result.excercises.length;
        if (limit && result.totalExcercises > limit)
          result.excercises = result.excercises.slice(0,limit);
        console.log(result);
        res.send(result);
      }
    });
  } else if (from && !to) {
    excerciseCollection.findOne({
      _id: id,
      "excercises": { $elemMatch: { "date": {$gt: from} } }
    }, {excercises: true, username: true, userage: true, _id: false}, {lean: true} ,function (err, result) {
      if (err) 
        res.send({"error": "An error has occurred"});
      else {
        result["totalExcercises"] = result.excercises.length;
        if (limit && result.totalExcercises > limit)
          result.excercises = result.excercises.slice(0,limit);
        console.log(result);
        res.send(result);
      }
    });
  } else if (!from && to) {
    excerciseCollection.findOne({
      _id: id,
      "excercises": { $elemMatch: { "date": {$lte: to} } }
    }, {excercises: true, username: true, userage: true, _id: false}, {lean: true} ,function (err, result) {
      if (err) 
        res.send({"error": "An error has occurred"});
      else {
        result["totalExcercises"] = result.excercises.length;
        if (limit && result.totalExcercises > limit)
          result.excercises = result.excercises.slice(0,limit);
        console.log(result);
        res.send(result);
      }
    });
  } else if (!from && !to) {
    excerciseCollection.findOne({
      _id: id
    }, {excercises: true, username: true, userage: true, _id: false}, {lean: true} ,function (err, result) {
      if (err) 
        res.send({"error": "An error has occurred"});
      else {
        result["totalExcercises"] = result.excercises.length;
        if (limit && result.totalExcercises > limit)
          result.excercises = result.excercises.slice(0,limit);
        console.log(result);
        res.send(result);
      }
    });
  }
});


// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
