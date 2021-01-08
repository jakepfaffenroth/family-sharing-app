// const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const bcrypt = require('bcryptjs');
// require('dotenv').config({ path: './bin/.env' });
const emailController = require('../users/emailController');
const db = require('../db').pgPromise;

// Passport config
passport.use(
  new LocalStrategy(async (username, password, done) => {
    const owner = await db.oneOrNone(
      'UPDATE owners SET last_login = CURRENT_TIMESTAMP WHERE username = $1 RETURNING *',
      [username]
    );

    if (!owner) {
      return done(null, owner, {
        msg: 'Incorrect username',
      });
    }
    bcrypt.compare(password, owner.password, (err, res) => {
      if (res) {
        // passwords match! log user in
        verbose('password correct!');
        return done(null, owner);
      } else {
        verbose('password incorrect...');
        // passwords do not match!
        return done(null, false, {
          msg: 'Incorrect password',
        });
      }
    });
  })
);

module.exports.login = (req, res, next) => {
  passport.authenticate('local', function (err, owner, info) {
    if (err) {
      return next(err);
    }
    const username = req.body.username;
    const password = req.body.password;

    if (!owner || owner.length === 0) {
      res.locals.incorrectCred = true;
      return res.render('login', {
        title: 'Carousel',
        loginUrl: '/auth/login',
        loginErrMsg: 'Incorrect username or password.',
        username: username,
        password: password,
      });
    }
    // Success; log in
    req.logIn(owner, function (err) {
      if (err) {
        return next(err);
      }
      // const response = { owner: owner, b2Credentials: res.locals.credentials };

      // Send owner info back to client as JSON
      // res.status(200).json(response);
      // return res.redirect(client + '/private-space');
      const ownerId = JSON.stringify(req.session.passport.user.ownerId).replace(
        /"/g,
        ''
      );
      // Set cookie on client with owner.ownerId
      res.cookie('ownerId', ownerId, { maxAge: 1000 * 60 * 60 * 24 * 7 });
      res.redirect(process.env.CLIENT + '?owner=' + ownerId);
    });
  })(req, res, next);
};

module.exports.logout = (req, res) => {
  req.logout();
  res.cookie('ownerId', '', { expires: new Date(0) });
  verbose('Logged out');
  req.session.destroy((err) => {
    error('Session destroy error:', err);
  });
  return res.redirect(process.env.SERVER);
};

module.exports.checkSession = async (req, res, next) => {
  try {
    let [owner, images, albums] = await db.multi(
      'SELECT * FROM owners WHERE owner_id = ${ownerId}; SELECT images.*, album_images.album_id FROM images LEFT JOIN album_images ON images.file_id = album_images.file_id WHERE images.owner_id = ${ownerId} ORDER BY upload_time ASC; SELECT album_id, album_name FROM albums WHERE owner_id = ${ownerId}',
      req.body
    );

    owner = owner[0]; //Extract owner from array; if row not found, owner === undefined
    if (!owner) {
      info('Could not find user logged in');
      return res.json({ isLoggedIn: false });
    }

    return res.json({
      isLoggedIn: true,
      owner,
      images,
      albums,
    });
  } catch (err) {
    error(err);
    return res.json({ isLoggedIn: false });
  }
};

module.exports.requestPasswordReset = async (req, res) => {
  if (req.protocol + '://' + req.get('host') === process.env.SERVER) {
    res.render('login', {
      heading: 'A password reset link has been emailed to you',
    });
  } else if (req.protocol + '://' + req.get('host') === process.env.CLIENT) {
    res.status(200).end();
  } else res.status(200).end();

  const email = req.body.email;
  if (!email) return;
  emailController.sendPasswordResetEmail(email);
};

module.exports.passwordResetForm = (req, res) => {
  const resetLink =
    process.env.SERVER + '/auth/submit-password-reset/' + req.params.owner;
  console.log('resetLink:', resetLink);
  res.render('passwordReset', { resetLink });
};

module.exports.submitPasswordReset = emailController.submitPasswordReset;
