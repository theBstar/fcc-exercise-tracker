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

const newUserSchema = mongoose.Schema({
  username: String,
  exercise: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "exerciseSchema"
  }]
});

const newExercise = mongoose.model("exercise", exerciseSchema)
const newUserModel = mongoose.model("newUserRecord", newUserSchema);


app.post("/api/exercise/add", function(req, res){
  let exercise = {
                description: req.body.description, 
                duration: req.body.duration, 
                date: req.body.date
              };
  if(req.body.userId){
    console.log("userId is not null");
    newUserModel.findById(req.body.userId, function(err, user){
      if(!err){
        const toBeSavedExercise = new newExercise(exercise)
        toBeSavedExercise.save((err, savedExercise)=>{
            if(!err) {
              console.log("exercise is saved "+savedExercise);
              console.log("here the user is "+user);
              newUserModel.findByIdAndUpdate(user.id, {$set:{exercise: [savedExercise.id]}},(err, updatedUser)=>{
                  if(!err){
                    console.log("everyhting done")
                    res.json(updatedUser);
                  }else{
                    res.send("<b>error!</b>");
                  }    
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
    newUserModel.findOne({username: req.body.username}, (err, data)=>{
      if(!data){
        newUserModel.create({username: req.body.username}, (err, data)=>{
          if(data){
            res.json({username: data.username, userId: data.id})
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
