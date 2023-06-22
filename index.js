const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });


//------creation de model mongoDB------//
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  }
});
let User = mongoose.model('User', userSchema);

const exerciceSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: false,
    default: Date.now()
  }
})
let Exercice = mongoose.model('Exercice', exerciceSchema);


//------FIN MODEL------//


//-------middleware-----//

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//-------FIN middleware-----//


app.post('/api/users', async (req, res) => {
  const userName = req.body.username
  const newUser = new User({ username: userName });
  try {
    await newUser.save();
    res.json({ _id: newUser._id, username: newUser.username });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Une erreur s\'est produite lors de l\'ajout de l\'utilisateur' });
  }
});


app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();

    res.json(users);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Une erreur s\'est produite lors de la récupération des utilisateurs' });
  }
})


app.post('/api/users/:_id/exercises', async (req, res) => {
  console.log('miam')
  const id = req.params._id;
  const { description, duration, date } = req.body

  console.log(req)

  try {
    const userLogged = await User.findById(id)
    console.log(userLogged)
    if (!userLogged) {
      res.send("Could not find user")
    } else {
      const newExerciseObj = new Exercice({
        user_id: userLogged._id,
        description,
        duration,
        date: date ? new Date(date) : new Date()
      })

      const newExercise = await newExerciseObj.save();

      res.json({
        _id: userLogged._id,
        username: userLogged.username,
        description: newExercise.description,
        duration: newExercise.duration,
        date: new Date(newExercise.date).toDateString()
      });
    }
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Une erreur s\'est produite' });
  }
})

app.get('/api/users/:_id/logs', async (req, res) => {
  const id = req.params._id
  const { from, to, limit } = req.query;
  const user = await User.findById(id)
  if (!user) {
    res.send("Could not find user")
    return
  }

  let dateObj = {}

  if (from) {
    dateObj["$gte"] = new Date(from)
  }
  if (to) {
    dateObj["$lte"] = new Date(to)
  }
  let filter = {
    user_id: id
  }
  if(from || to) {
    filter.date = dateObj
  }
    
  const logs = await Exercice.find(filter).limit(+limit ?? 500)

  const finalLogs = logs.map(e => ({
    description: e.description,
    duration: e.duration,
    date: e.date.toDateString()
  }))
    
  res.json({
    username: user.username,
    count: logs.length,
    _id: user._id,
    log: finalLogs
  });
}) 

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
