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
  // TODO - add stronger password requirements
  body('username', 'Username must not be empty.').trim().isLength({ min: 1 }),
  body('password', 'Password must not be empty.').trim().isLength({ min: 1, max: 64 }),
  body('firstName', 'First Name must not be empty.').trim().isLength({ min: 1, max: 64 }),
  body('lastName', 'Last Name must not be empty.').trim().isLength({ min: 1, max: 64 }),

  // Check if username already taken
  body('username')
    .custom(async (value) => {
      const foundUser = await db.oneOrNone('SELECT * FROM users WHERE username = $1', [value]);
      if (foundUser) return Promise.reject('Username taken');
    })
    .bail(),

  // Remove whitespace (sanitization)
  body('*').escape().trim().bail(),

  // TODO - Make sure password confirmation matches
  //   body('confirmPassword', 'Confirm your password.').trim().isLength({ min: 1 }).bail(),
  //   body('confirmPassword')
  //     .custom((value, { req }) => {
  //       /**/ console.log('checking passwords...');
  //       if (value !== req.body.password) {
  //         return false;
  //       }
  //       return true;
  //     })
  //     .bail(),
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

      res.render('signup', {
        errMsg: errors.array()[0].msg,
        username: username,
        password: password,
        firstName: firstName,
        lastName: lastName,
      });
    }
    if (errors.isEmpty()) {
      /**/ console.log('validation passed');
      // Takes req.body.password and hashes it
      // then saves hashed password to db instead of plain text password
      bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
        /**/ console.log('hashing password...');

        if (err) return next(err);

        const user = await db.one(
          'INSERT INTO users (user_id, username, first_name, last_name, password, guest_id) VALUES (${id}, ${username}, ${firstName}, ${lastName}, ${password}, ${guestId}) RETURNING *',
          {
            id: uuidv4(),
            username: req.body.username,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            password: hashedPassword,
            guestId: uuidv4(),
          }
        );

        success('User ' + user.username + ' created');
        // Account created; redirect to login screen
        res.redirect('../login');
      });
    }
  },
];

module.exports.getUser = async (req, res) => {
  try {
    db.task(async (t) => {
      const user = await db.oneOrNone(
        'SELECT first_name, user_id, guest_id FROM users WHERE guest_id = ${guestId}',
        req.body
      );

      if (!user) {
        console.log('Could not find user - incorrect guestId?');
        return res.redirect(process.env.SERVER);
      }

      const images = await db.any('SELECT * FROM images WHERE owner_id = ${userId}', user);
      return res.json({
        user: user,
        images: images,
      });
    });
  } catch (err) {
    error(err);
    return res.end();
  }
};
