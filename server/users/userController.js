const express = require('express');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { sanitizeBody } = require('express-validator');
// const async = require("async");
const { User } = require('./userModel.js');
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
    .custom((value) => {
      return User.findOne({ username: value }).then((foundUser) => {
        if (foundUser) {
          return Promise.reject('Username taken');
        }
      });
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
      /**/ console.log('Validation failed:');
      for (let i = 0; i < errors.array().length; i++) {
        if (errors.array()[i].msg) {
          console.log('::' + errors.array()[i].param + ': ' + errors.array()[i].msg);
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

      // next();
    }
    if (errors.isEmpty()) {
      /**/ console.log('validation passed');
      // Takes req.body.password and hashes it
      // then saves hashed password to db instead of plain text password
      bcrypt.hash(req.body.password, 10, (err, hashedPassword) => {
        /**/ console.log('hashing password...');
        if (err) return next(err);

        const guestId = uuidv4();

        const newUser = new User({
          username: req.body.username,
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          password: hashedPassword,
          guestId: guestId,
          images: [],
          lastNotification: '2000-01-01T00:00:00.000+00:00',
          subscribers: { email: [], browser: [] },
        });
        //   Hashing complete; save to DB
        User.create(newUser);
        //   Send success msg to client
        console.log('User ' + newUser.username + ' created');
        // Account created; redirect to login screen
        res.redirect('../login');
      });
    }
  },
];

module.exports.getUser = (req, res) => {
  const guestId = req.body.guestId;
  return User.findOne({ guestId: guestId }).then((foundUser) => {
    if (foundUser) {
      return res.json(foundUser);
    }
  });
};
