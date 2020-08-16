// const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const db = require('../db').pgPromise;

// Passport config
passport.use(
  new LocalStrategy(async (username, password, done) => {
    const user = await db.oneOrNone('SELECT * FROM users WHERE username = $1', [username]);

    if (!user) {
      return done(null, user, {
        msg: 'Incorrect username',
      });
    }
    bcrypt.compare(password, user.password, (err, res) => {
      if (res) {
        // passwords match! log user in
        console.log('password correct!');
        console.log('res: ', user);
        return done(null, user);
      } else {
        console.log('password incorrect...');
        // passwords do not match!
        return done(null, false, {
          msg: 'Incorrect password',
        });
      }
    });
  })
);

module.exports.login = (req, res, next) => {
  console.log('attempting login...');
  passport.authenticate('local', function (err, user, info) {
    if (err) {
      return next(err);
    }
    if (!user || user.length === 0) {
      res.locals.incorrectCred = true;
      return res.redirect('../login?q=true');
    }
    // Success; log in
    req.logIn(user, function (err) {
      if (err) {
        return next(err);
      }
      const response = { user: user, b2Credentials: res.locals.credentials };

      // Send user info back to client as JSON
      // res.status(200).json(response);
      // return res.redirect(client + '/private-space');
      console.log('req: ', req.session);
      const userId = JSON.stringify(req.session.passport.user.userId).replace(/"/g, '');
      console.log('userId: ', userId);
      // Set cookie on client with user.userId
      res.cookie('ownerId', userId, { maxAge: 1000 * 60 * 60 * 24 * 7 });
      res.redirect(process.env.CLIENT + '?user=' + userId);
    });
  })(req, res, next);
};

module.exports.logout = (req, res) => {
  req.logout();
  res.cookie('ownerId', '', { expires: new Date(0) });
  console.log('Logged out');
  req.session.destroy((err) => {
    console.log('Session destroy error:', err);
  });
  return res.redirect(process.env.SERVER + 'login');
};

module.exports.checkSession = async (req, res, next) => {
  console.log('Checking for user session -- userId:', req.body.userId);

  try {
    let [user, images] = await db.multi(
      'SELECT username, first_name, user_id, guest_id FROM users WHERE user_id = ${userId};SELECT * FROM images WHERE owner_id = ${userId}',
      req.body
    );

    user = user[0]; //Extract user from array; if row not found, user === undefined

    if (!user) {
      console.log('Could not find user logged in');
      return res.json({ isLoggedIn: false });
    }

    console.log('User ' + user.username + ' is logged in');

    return res.json({
      isLoggedIn: true,
      user: user,
      images: images,
    });

    db.task(async (t) => {
      const user = await db.oneOrNone(
        'SELECT username, first_name, user_id, guest_id FROM users WHERE user_id = ${userId}',
        req.body
      );

      if (!user) {
        console.log('Could not find user logged in');
        return res.json({ isLoggedIn: false });
      }

      const images = await db.any('SELECT * FROM images WHERE owner_id = ${userId}', req.body);

      console.log('User ' + user.username + ' is logged in');

      return res.json({
        isLoggedIn: true,
        user: user,
        images: images,
      });
    });
  } catch (err) {
    console.error(err);
    return res.json({ isLoggedIn: false });
  }
};
