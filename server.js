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
    description: String,
    duration: Number,
    date: Date
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
     
    UserModel.findByIdAndUpdate(req.body.userId,{$push:{exercise:exercise}}, (err, updatedUser)=>{ //this will return the old data
          if(err) res.send("<b>something went wrong</b>");                                        // to get updated array pass {new: true} to findAndUpdate
          UserModel.findById(updatedUser.id, (err, actullyUpdatedUser)=>{
            console.log("tihs has run ok "+actullyUpdatedUser);
           res.json(actullyUpdatedUser);
          });
        })
    
  }else{
    res.send("<b>UserId, duration and description cannot be empty</b>")
  }
  
})

// get the exercises
app.get("/api/exercise/log", (req, res)=>{
  console.log(req.query)
  if(!req.query.userId) res.send("You must enter a userId")
  let from = req.query.from || null
  let to = req.query.to || null
  let limit  = req.query.limit || null
  UserModel.findById(req.query.userId).where("date">from && "date"<to).limit(limit).exec((err, data)=>{
    console.log("running")
   if(err) res.send("error");
   res.json(data);
  })
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
