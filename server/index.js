const express = require('express');
const PORT = process.env.PORT || 3050;

const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const session = require('express-session');
const bcrypt = require('bcryptjs');

const app = express();

const User = require('./users/userModel');
const apiRoutes = require('./routes/apiRoutes');

const CLIENT = process.env.VUE_APP_CLIENT;

//connect to mongoDB
mongoose.connect('mongodb://localhost/familyapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Auth
passport.use(
  new LocalStrategy((username, password, done) => {
    console.log('username: ', username);
    User.findOne({ username: username }, function(err, user) {
      console.log('user: ', user);
      if (err) return done(err);
      if (!user) {
        return done(null, false, { msg: 'Incorrect username' });
      }
      // Compare plain-text pw to hashed pw in db
      bcrypt.compare(password, user.password, (err, res) => {
        if (res) {
          // passwords match! log user in
          /**/ console.log('password correct!');
          return done(null, user);
        } else {
          /**/ console.log('password incorrect...');
          // passwords do not match!
          return done(null, false, { msg: 'Incorrect password' });
        }
      });
    });
  })
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id, (err, user) => {
    done(err, user);
  });
});

app.use(session({ secret: 'gus', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

//add routes
app.use('/api', apiRoutes);
app.post(
  '/api/login',
  passport.authenticate('local', {
    successRedirect: CLIENT + '/private-space',
    failureRedirect: '/login',
    // failureFlash: 'Invalid username or password.',
    // successFlash: 'Welcome!',
  })
);

app.listen(PORT, function() {
  console.log(`🌎  ==> API Server now listening on PORT ${PORT}!`);
});
