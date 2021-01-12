const passport = require('passport');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { sanitizeBody } = require('express-validator');
const db = require('../db').pgPromise;
const { ParameterizedQuery: PQ } = require('pg-promise');
const pgpHelpers = require('../db').pgpHelpers;
const { confirmOwnerEmailSender } = require('../tasks');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { error } = require('winston');

passport.initialize();

module.exports.create = [
  // VALIDATE FIELDS
  // username and password must not be empty
  body('username', 'Username must not be empty.').trim().isLength({ min: 1 }),
  body('email', 'Email must not be empty.').trim(),
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

  // Process request after validation and sanitization

  (req, res, next) => {
    const errors = validationResult(req);
    // Print error messages to console
    if (!errors.isEmpty()) {
      error('Validation failed:');
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
      console.log('validation passed');
      // Takes req.body.password and hashes it
      // then saves hashed password to db instead of plain text password
      bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
        console.log('hashing password...');

        if (err) return next(err);

        const owner = await db.task(async (t) => {
          const newOwner = await t.one(
            'INSERT INTO owners (owner_id, username, first_name, last_name, email,password, guest_id, is_active, is_auth, auth_token) VALUES (DEFAULT, ${username}, ${firstName}, ${lastName}, ${email}, ${password}, DEFAULT, TRUE, FALSE, DEFAULT) RETURNING owner_id, username, first_name, last_name, auth_token',
            {
              username: req.body.username,
              firstName: req.body.firstName,
              lastName: req.body.lastName,
              email: req.body.email,
              password: hashedPassword,
            }
          );

          const customer = await stripe.customers.create({
            name: `${req.body.lastName}, ${req.body.firstName}`,
            email: req.body.email,
            metadata: { ownerId: newOwner.ownerId },
          });

          return await t.one(
            'UPDATE owners SET customer_id = ${customerId} WHERE owner_id = ${ownerId} RETURNING *',
            {
              customerId: customer.id,
              ownerId: newOwner.ownerId,
            }
          );
        });

        confirmOwnerEmailSender.add({
          owner: { ...owner, email: req.body.email },
        });
        success('User ' + owner.username + ' created');

        //Account created; redirect to account completion screen (choose plan)
        res.cookie('ownerId', owner.ownerId, {
          maxAge: 1000 * 60 * 60 * 24 * 7,
        });
        res.cookie('customerId', owner.customerId, {
          maxAge: 1000 * 60 * 60 * 24 * 7,
        });
        res.render('accountCompletion', {
          name: owner.firstName,
          customerId: owner.customerId,
          ownerId: owner.id,
          server: process.env.SERVER,
        });
      });
    }
  },
];

// For GUESTS - fetches owner info and images
module.exports.getOwner = async (req, res) => {
  try {
    db.task(async (t) => {
      const owner = await t.oneOrNone(
        'SELECT * FROM owners WHERE guest_id = ${guestId}',
        req.body
      );

      if (owner.deleted) {
        console.log('Owner deleted account');
        return res.redirect(process.env.SERVER);
      }

      if (!owner) {
        console.log('Could not find user - incorrect guestId?');
        return res.redirect(process.env.SERVER);
      }

      const [images, albums] = await t.multi(
        'SELECT images.*, album_images.album_id FROM images LEFT JOIN album_images ON images.file_id=album_images.file_id WHERE images.owner_id=${ownerId}; SELECT album_id, album_name FROM albums WHERE owner_id = ${ownerId}',
        owner
      );

      return res.json({
        owner,
        images,
        albums,
      });
    });
  } catch (err) {
    error(err);
    return res.end();
  }
};

module.exports.DELETE_ACCOUNT = async (req, res) => {
  const values = {
    ownerId: req.body.ownerId,
    deletedTS: 'deleted_' + Date.now(),
    blank: '###',
  };

  const ownerQuery =
    'UPDATE owners SET username = gen_random_uuid(), first_name = ${blank}, last_name = ${blank}, email = ${blank}, password = ${blank}, deleted = current_timestamp, is_active = FALSE WHERE owner_id = ${ownerId} RETURNING *';

  const imagesQuery =
    "UPDATE images SET file_name = 'deleted', file_id = gen_random_uuid(), src = ${blank}, thumbnail = ${blank}, exif = '{}'::jsonb, thumb_file_id = ${blank} WHERE owner_id = ${ownerId} RETURNING *";

  const albumQuery =
    "UPDATE albums SET album_name = 'deleted' WHERE owner_id = ${ownerId} RETURNING *";

  const subscriberQuery =
    "UPDATE subscribers SET email = ${blank}, browser = '{}'::jsonb, first_name = ${blank}, last_name = ${blank} WHERE guest_id = (SELECT guest_id FROM owners WHERE owner_id = ${ownerId}) RETURNING *";

  const [owner] = await db.tx(async (tx) => {
    const queries = [
      tx.one(ownerQuery, values),
      tx.any(imagesQuery, values),
      tx.any(albumQuery, values),
      tx.any(subscriberQuery, values),
    ];

    return Promise.all(queries);
  });
  console.log('owner:', owner);
  try {
    const deleted = await stripe.customers.del(owner.customerId);
    console.log('deleted:', deleted);
  } catch (err) {
    console.error(err);
  }

  res.status(200).end();
};
