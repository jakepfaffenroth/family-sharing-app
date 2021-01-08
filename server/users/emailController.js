const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');

const db = require('../db').pgPromise;
const { encrypt, decrypt } = require('../utils/encryptDecrypt');
const sendEmail = require('../utils/sendEmail');
const AWS = require('aws-sdk');
const credentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
};
// const ses = new AWS.SES({ credentials: credentials, region: 'us-west-2' });

const sendOwnerConfirmationEmail = async (input) => {
  // Handle form data if coming from invalid link re-subscribe page
  owner = input.owner || input;
  let res = input.res || null;

  const sender = 'Carousel Account Confirmation';
  const recipient = owner.email;
  const subject = 'Confirm your email';
  const verifyLink = `${process.env.SERVER}/user/verify-email/?owner=true&token=${owner.authToken}&id=${owner.ownerId}`;
  const body_text = 'Confirm your email using this link: \n' + verifyLink;
  // The HTML body of the email.
  const body_html = `<html>
    <head></head>
    <body>
      <h1>Confirm your email</h1>
      <p>Please confirm your email by clicking this link or pasting it into your browser:</p>
        <a href='${verifyLink}'>${verifyLink}</a>
    </body>
    </html>`;

  const params = {
    sender,
    recipient,
    subject,
    body_text,
    body_html,
  };
  const emailSent = await sendEmail(params, res);

  if (emailSent) {
    res.status(204).end();
  } else {
    res.status(500).end();
  }
};

const confirmOwnerEmail = async (req, res, next) => {
  // let ownerInfo = JSON.parse(req.query.owner);
  // ownerInfo = decrypt(ownerInfo);
  const token = req.query.token;
  // If decrypt fails (node probably restarted, or other link error) try subscribing again.
  // if (!ownerInfo) {
  //   const oId = req.query.id;
  //   const subscribeLink = `${process.env.SERVER}/user/subscribe-email`;
  //   return res.status(418).render('verificationError', {
  //     ownerId: oId,
  //     subscribeLink: subscribeLink,
  //   });
  // }

  // const owner = await db.oneOrNone(
  //   'SELECT * FROM owners WHERE auth_token = ${token}',
  //   { token }
  // );

  // if (owner.email) {
  //   res.status(200).send('Already confirmed email');
  // }

  const [
    email,
    updatedOwner,
  ] = await db.multi(
    'SELECT email FROM owners WHERE auth_token = ${token}; UPDATE owners SET is_auth = TRUE WHERE auth_token = ${token} AND is_auth = FALSE RETURNING email',
    { token }
  );
  success(email + ' confirmed.');

  res.status(200).redirect('/login?emailconfirmed=true');
};

const sendGuestVerificationEmail = async (data) => {
  let { guest, owner } = data;
  // Handle form data if coming from invalid link re-subscribe page
  // if (req.body && !req.body.guest) {
  //   guest = req.body;
  // }
  if (guest.guest) {
    guest = guest.guest;
  }

  // Email not found in DB (guest hasn't subscribed yet)
  const sender = 'Carousel Email Verification';
  const recipient = guest.email;
  const subject = `Verify your subscription to ${owner.firstName}'s photos`;
  const queryParam = encodeURI(JSON.stringify(encrypt(guest)));
  const verifyLink = `${process.env.SERVER}/user/verify-email/?guest=${queryParam}&id=${guest.guestId}`;
  const body_text = 'Verify using this link: \n' + verifyLink;
  // The HTML body of the email.
  const body_html = `<html>
    <head></head>
    <body>
      <h1>Verify your subscription to ${owner.firstName}'s photos</h1>
      <p>Please verify your email subscription by clicking this link or pasting it into your browser:</p>
        <a href='${verifyLink}'><button style="border: 0.25rem black solid, padding:0.25rem, background-color:red">Verify</button></a>
    </body>
    </html>`;

  const params = {
    sender,
    recipient,
    subject,
    body_text,
    body_html,
  };

  sendEmail(params);
};

// Guests routed here after clicking verification link
// link query param decrypted into guest info object
// Updates the owner doc in DB with guest info
const verifyGuestEmail = async (req, res, next) => {
  let guest = JSON.parse(req.query.guest);
  guest = decrypt(guest);
  // If decrypt fails (node probably restarted, or other link error) try subscribing again.
  if (!guest) {
    const gId = req.query.id;
    const subscribeLink = `${process.env.SERVER}/user/subscribe-email`;
    return res.status(418).render('verificationError', {
      guestId: gId,
      subscribeLink: subscribeLink,
    });
  }

  const subscriber = await db.oneOrNone(
    'SELECT * FROM subscribers WHERE email = ${email}',
    guest
  );

  if (subscriber) {
    res.status(200).send('Already verified email');
  }

  const newEmailSubscriber = await db.one(
    'INSERT INTO subscribers (guest_id, email, first_name, last_name) VALUES (${guestId}, ${email}, ${firstName}, ${lastName}) RETURNING *',
    guest
  );

  success(newEmailSubscriber.email + ' saved.');

  const guestLink = `${process.env.SERVER}/${guest.guestId}/guest`;

  res.status(200).render('emailVerified', { guestLink: guestLink });
};

const sendPasswordResetEmail = async (email) => {
  const owner = await db.oneOrNone(
    'SELECT owner_id FROM owners WHERE email = ${email}',
    { email }
  );

  if (!owner) return;

  const queryParam = encodeURI(JSON.stringify(encrypt(owner.ownerId)));
  const resetLink = `${process.env.SERVER}/auth/password-reset-form/${queryParam}`;

  const sender = 'Carousel Password Reset';
  const recipient = email;
  const subject = 'Password reset';
  const body_text = 'Reset your password using this link: \n' + resetLink;
  const body_html = `<html>
  <head></head>
    <body>
      <h1>Reset your password</h1>
      <p>Visit the password reset page by clicking this link or pasting it into your browser.</p>
      <p><strong>If you did not request a password reset, please ignore this email.</strong></p>
      <a href='${resetLink}'>${resetLink}</a>
    </body>
  </html>`;

  const params = {
    sender,
    recipient,
    subject,
    body_text,
    body_html,
  };

  sendEmail(params);
};

const submitPasswordReset = [
  body('password', 'Password must not be empty.').trim(),
  body('password', 'Password must be at least 6 characters.').isLength({
    min: 6,
  }),

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

  async (req, res) => {
    const encryptedOwnerId = JSON.parse(req.params.owner);
    const ownerId = decrypt(encryptedOwnerId);

    const errors = validationResult(req);
    // Print error messages to console
    if (!errors.isEmpty()) {
      /**/ error('Validation failed:');
      for (let i = 0; i < errors.array().length; i++) {
        if (errors.array()[i].msg) {
          error('::' + errors.array()[i].param + ': ' + errors.array()[i].msg);
        }
      }
    } else if (errors.isEmpty()) {
      bcrypt.hash(req.body.password, 10, async (err, hashedPassword) => {
        const updatedOwner = await db.oneOrNone(
          'UPDATE owners SET password = ${hashedPassword} WHERE owner_id = ${ownerId} RETURNING password',
          { ownerId, hashedPassword }
        );
        res.redirect('/login');
        // bcrypt.compare(
        //   req.body.password,
        //   updatedOwner.password,
        //   (err, result) => {
        //     if (validationResult) {
        //       // passwords match! log user in
        //       verbose('passwords match!');
        //       return;
        //     } else {
        //       verbose('password dont match...');
        //       // passwords do not match!
        //       return;
        //     }
        //   }
        // );
      });
    }
  },
];

module.exports = {
  sendOwnerConfirmationEmail,
  confirmOwnerEmail,
  sendGuestVerificationEmail,
  verifyGuestEmail,
  sendPasswordResetEmail,
  submitPasswordReset,
};
