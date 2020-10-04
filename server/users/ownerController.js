const passport = require('passport');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { sanitizeBody } = require('express-validator');
const db = require('../db').pgPromise;
const { v4: uuidv4 } = require('uuid');

passport.initialize();

module.exports.create = [
  // VALIDATE FIELDS
  // username and password must not be empty
  body('username', 'Username must not be empty.').trim().isLength({ min: 1 }),
  body('password', 'Password must not be empty.').trim(),
  body('password', 'Password must be at least 6 characters.').isLength({
    min: 6,
  }),
  body('firstName', 'First Name must not be empty.')
    .trim()
    .isLength({ min: 1, max: 64 }),
  body('lastName', 'Last Name must not be empty.')
    .trim()
    .isLength({ min: 1, max: 64 }),

  // Check if username already taken
  body('username')
    .custom(async (value) => {
      const foundUser = await db.oneOrNone(
        'SELECT * FROM owners WHERE username = $1',
        [value]
      );
      if (foundUser) return Promise.reject('Username taken');
    })
    .bail(),

  // Remove whitespace (sanitization)
  body('*').escape().trim().bail(),

  body('confirmPassword', 'Enter a password.')
    .trim()
    .isLength({ min: 1 })
    .bail(),
  body('confirmPassword', 'Confirm your password.')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        return false;
      }
      return true;
    })
    .bail(),
  //

  // Process request after validation and sanitization

  (req, res, next) => {
    const errors = validationResult(req);
    // Print error messages to console
    if (!errors.isEmpty()) {
      /**/ error('Validation failed:');
      for (let i = 0; i < errors.array().length; i++) {
        if (errors.array()[i].msg) {
          error('::' + errors.array()[i].param + ': ' + errors.array()[i].msg);
        }
      }
      const username = req.body.username;
      const password = req.body.password;
      const firstName = req.body.firstName;
      const lastName = req.body.lastName;
      const email = req.body.email;
      console.log('errors.array():', errors.array());
      res.render('signup', {
        title: 'Carousel',
        loginUrl: process.env.SERVER + '/auth/login',
        errMsg: errors.array()[0].msg,
        username: username,
        password: password,
        firstName: firstName,
        lastName: lastName,
        email: email,
      });
    }
    if (errors.isEmpty()) {
      /**/ console.log('validation passed');
      // Takes req.body.password and hashes it
      // then saves hashed password to db instead of plain text password
      bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
        /**/ console.log('hashing password...');

        if (err) return next(err);

        const owner = await db.one(
          'INSERT INTO owners (owner_id, username, first_name, last_name, password, guest_id) VALUES (${id}, ${username}, ${firstName}, ${lastName}, ${password}, ${guestId}) RETURNING *',
          {
            id: uuidv4(),
            username: req.body.username,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            password: hashedPassword,
            guestId: uuidv4(),
          }
        );

        success('User ' + owner.username + ' created');

        //Account created; redirect to account completion screen (choose plan)
        res.redirect('/complete-signup' + '?owner=' + owner.ownerId);

        // Account created; redirect to login screen
        // res.redirect('/login');
      });
    }
  },
];

module.exports.choosePlan = async (req, res) => {
  const quota = setQuota(req.body.plan);
  function setQuota(plan) {
    switch (plan) {
      case 'basic':
        return 2000;
      case 'premium':
        return 10000;
      case 'premium plus':
        return 200000;
    }
  }

  try {
    const owner = await db.oneOrNone(
      'UPDATE owners SET plan = $plan, quota = $quota WHERE owner_id = $ownerId RETURNING *',
      { ...req.body, quota }
    );
    console.log('owner.plan:', owner.plan);
    console.log('owner.quota:', owner.quota);
  } catch (err) {
    error('err:', err);
  }
};

module.exports.getOwner = async (req, res) => {
  try {
    db.task(async (t) => {
      const owner = await db.oneOrNone(
        'SELECT first_name, last_name, owner_id, guest_id, premium_user FROM owners WHERE guest_id = ${guestId}',
        req.body
      );

      if (!owner) {
        console.log('Could not find user - incorrect guestId?');
        return res.redirect(process.env.SERVER);
      }

      const images = await db.any(
        'SELECT * FROM images WHERE owner_id = ${ownerId}',
        owner
      );
      return res.json({
        owner: owner,
        images: images,
      });
    });
  } catch (err) {
    error(err);
    return res.end();
  }
};
