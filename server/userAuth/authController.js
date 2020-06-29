const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const axios = require('axios');
require('dotenv').config();

const User = require('../users/userModel');

// Passport config
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

module.exports.login = (req, res, next) => {
  console.log('attempting login...');
  passport.authenticate('local', function(err, user, info) {
    if (err) {
      return next(err);
    }
    if (!user) {
      res.locals.incorrectCred = true;
      return res.render('/login', { incorrectCred: msg });
    }
    // Success; log in
    req.logIn(user, function(err) {
      if (err) {
        return next(err);
      }
      const response = { user: user, b2Credentials: res.locals.credentials };

      // Send user info back to client as JSON
      // res.status(200).json(response);
      // return res.redirect(client + '/private-space');
      console.log('req.session (inside login logic): ', req.session);

      const userId = JSON.stringify(req.session.passport.user._id).replace(/"/g, '');
      console.log('userId: ', userId);
      // Set cookie on client with user._id
      res.cookie('user._id', userId, { maxAge: 1000 * 60 * 60 * 24 * 7 });
      res.redirect(process.env.CLIENT);
    });
  })(req, res, next);
  // {
  //   failureRedirect: client + '/login',
  //   successRedirect: client + '/private-space',
  // failureFlash: 'Invalid username or password.',
  // successFlash: 'Welcome!',
};

module.exports.logout = (req, res) => {
  req.session.destroy();
  req.logout();
  res.redirect(process.env.CLIENT);
  console.log('Logged out');
};

module.exports.checkSession = (req, res, next) => {
  const userId = req.body.userId;
  console.log('userId: ', userId);
  console.log('Checking for user session');
  // passport.deserializeUser(function(userId, done) {
  //   console.log('deserialize user: ', user);
  User.findById(userId, function(err, user) {
    // done(err, user);
    if (err || !user) {
      console.log('Could not find user logged in');
      return res.json({ isLoggedIn: false });
    }
    console.log('User is logged in');
    return res.json({ isLoggedIn: true, user: { firstName: user.firstName, _id: user._id } });
  });
  // });
};

// ----- Session logic -----
//connect to mongoDB
const mongoDb = process.env.MONGO;

mongoose.connect(mongoDb, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
