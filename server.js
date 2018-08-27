const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')

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
const exerciseSchema = mongoose.Schema({
  description: String,
  duration: Number,
  date: Date
})

const userSchema = mongoose.Schema({
  username: String,
  exercise: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "exercise"
  }]
});

const Exercise = mongoose.model("exercise", exerciseSchema)
const UserModel = mongoose.model("userRecord", userSchema);


app.post("/api/exercise/add", function(req, res){
  let exercise = {
                description: req.body.description, 
                duration: req.body.duration, 
                date: req.body.date
              };
  if(req.body.userId){
    console.log("userId is not null");
    UserModel.findById(req.body.userId, function(err, user){
      if(!err){
        console.log("userId found in the database "+user)
        UserModel.findByIdAndUpdate(
          user.id, 
          {
            $set:{
              exercise: exercise
            }
          },(err, updatedUser)=>{
            if(!err) {
              console.log("this is the updated user "+ updatedUser)
              res.json({
                userId: updatedUser.id,
                description: updatedUser.exersice.description,
                duration: updatedUser.exersice.duration,
                date: updatedUser.exersice.date
              })
            }else{
              res.send("<b>error!</b>")
            }
          })
      }else{
        res.send("<h1>Error has occurred</h1>")
      }
    })
  }
})
app.post("/api/exercise/new-user", function(req, res){
  if(req.body.username){
    UserModel.findOne({username: req.body.username}, (err, data)=>{
      if(!data){
        UserModel.create({username: req.body.username}, (err, data)=>{
          if(data){
            res.json({username: data.username, userId: data.userId})
          }
        })
      }else{
        res.json({username: data.username, userId: data.id})
      }
    })
  }else{
    res.send("error! try again with non-empty username")
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
