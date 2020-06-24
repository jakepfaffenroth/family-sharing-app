const express = require('express');
const PORT = process.env.PORT || 3050;

const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const cors = require('cors');

const app = express();

const User = require('./users/userModel');
const fileRoutes = require('./fileServer/fileRouter');
const fileController = require('./fileServer/fileController');

const CLIENT = process.env.VUE_APP_CLIENT;
const MONGO = 'mongodb://localhost/familyapp';

//connect to mongoDB
mongoose.connect(MONGO, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Auth
passport.use(
  new LocalStrategy((username, password, done) => {
    User.findOne({ username: username }, function(err, user) {
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

app.use(cors({ origin: CLIENT, credentials: true }));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

//add routes
app.use('/api', fileRoutes);

const sessionStore = new MongoStore({ url: MONGO, collection: 'sessions' });

app.use(
  session({
    secret: 'gus',
    store: sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
  console.log('serialize user: ', user);
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  console.log('deserialize user: ', user);
  User.findById(user._id, function(err, user) {
    done(err, user);
  });
});

// Login, Logout routes
app.post('/api/login', function(req, res, next) {
  console.log('attempting login...');
  passport.authenticate('local', function(err, user, info) {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.redirect(CLIENT + '/login');
    }
    // Success; log in
    req.logIn(user, function(err) {
      if (err) {
        return next(err);
      }
      const response = { user: user, b2Credentials: res.locals.credentials };
      // Send user info back to client as JSON
      res.status(200).json(response);
      // return res.redirect(CLIENT + '/private-space');
      console.log('req.session (inside login logic): ', req.session);
    });
  })(req, res, next);
  // {
  //   failureRedirect: CLIENT + '/login',
  //   successRedirect: CLIENT + '/private-space',
  // failureFlash: 'Invalid username or password.',
  // successFlash: 'Welcome!',
});

app.get('/logout', function(req, res) {
  req.session.destroy();
  req.logout();
  res.redirect(CLIENT);
  console.log('Logged out');
});

app.get('/user-auth', (req, res) => {
  console.log('/user-auth req.session: ', req.session);
  if (req.session.passport) {
    return res.json({ user: req.session.passport.user });
  }
  res.json('session not found');
});

app.listen(PORT, function() {
  console.log(`🌎  ==> API Server now listening on PORT ${PORT}!`);
});
