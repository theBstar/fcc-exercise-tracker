const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const validator = require("validator")

const mongoose = require('mongoose')
mongoose.connect(process.env.MLAB_URI)

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
// schemas
const userSchema = mongoose.Schema({
  username: String,
  exercise: [{
    
  }]
})

const UserModel  = mongoose.model("person", userSchema);

app.post("/api/exercise/new-user", (req, res)=>{
  if(!req.body.username){
    res.send("error , try again!");   
  };
  UserModel.create({username: req.body.username}, (err, user)=>{
    if(err){
      res.send("something went wrong");
    }
    res.json({username: user.username, userId: user.id});
  })
});

app.post("/api/exercise/add", (req, res)=>{
  
  if(req.body.userId && req.body.duration && req.body.description){
    
    let date = validator.isISO8601(req.body.date)? req.body.date: "0";
    let exercise = {
      duration: req.body.duration,
      description: req.body.description,
      date: new Date(date)
    }
    
    UserModel.findByIdAndUpdate(req.body.userId,{"$set":{exercise:exercise}}, (err, updatedUser)=>{
          if(err) res.send("<b>something went wrong</b>");
          UserModel.findById(updatedUser.id, (err, u)=>{console.log(u)});
           res.json(updatedUser);
        })
    
  }else{
    res.send("<b>UserId, duration and description cannot be empty</b>")
  }
  
})

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
