const mongoose = require('mongoose');
const crypto = require('crypto');
const algorithm = 'aes-256-cbc';
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);
const webPush = require('web-push');
const add = require('date-fns/add');
const toDate = require('date-fns/toDate');
const compareAsc = require('date-fns/compareAsc');
require('dotenv').config();
const User = require('../users/userModel');

const AWS = require('aws-sdk');
const { ForecastQueryService } = require('aws-sdk');
const credentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
};
const sns = new AWS.SNS({ credentials: credentials, region: 'us-west-2' });
const ses = new AWS.SES({ credentials: credentials, region: 'us-west-2' });

const encrypt = (object) => {
  // convert object into string to be encrypted
  let text = JSON.stringify(object);
  let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return { iv: iv.toString('hex'), encryptedData: encrypted.toString('hex') };
};

const decrypt = (guest) => {
  try {
    let iv = Buffer.from(guest.iv, 'hex');
    let encryptedText = Buffer.from(guest.encryptedData, 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    // Convert the decrypted string back into an object
    return JSON.parse(decrypted.toString());
  } catch (err) {
    return;
  }
};

// Marks the user as a guest
module.exports.mark = (req, res) => {
  // extracts guestId from path
  const guestId = req.path.split('/')[1];
  // Set guestId cookie on client
  res.cookie('guestId', guestId, { maxAge: 1000 * 60 * 60 * 24 * 7 });
  res.redirect(process.env.CLIENT + '?guest=' + guestId);
};

// ---------------------------------------------------
// ------- Guest Subscription and Verification -------

// Sends guests subscription verification emails
module.exports.subscribeEmail = async (req, res) => {
  let guest = req.body.guest;

  // Handle form data if coming from invalid link re-subscribe page
  if (req.body && !req.body.guest) {
    guest = req.body;
  }

  const emailAddress = guest.email;
  const firstName = guest.firstName;
  const lastName = guest.lastName;
  const guestId = guest.guestId;
  let owner;

  await User.findOne({ guestId: guestId }).then((foundOwner) => {
    owner = foundOwner;
  });

  // First need to see if guest has already subscribed
  User.findOne({ 'subscribers.email.emailAddress': emailAddress }).then((foundUser) => {
    if (foundUser) {
      console.log('foundEmail', foundUser.subscribers.email);
      res.status(200).send('Already subscribed email');
    } else {
      // Email not found in DB (guest hasn't subscribed yet)
      const sender = `Carousel Email Verification <notification@carousel.jakepfaf.dev>`;
      const recipient = emailAddress;
      const subject = `Verify your subscription to ${owner.firstName}'s photos`;
      const queryParam = encodeURI(JSON.stringify(encrypt(guest)));
      const verifyLink = `${process.env.SERVER}/guest/verify-email/?guest=${queryParam}&id=${guestId}`;
      const body_text = 'Verify using this link: \n' + verifyLink;

      // The HTML body of the email.
      const body_html = `<html>
    <head></head>
    <body>
      <h1>Verify your subscription to ${owner.firstName}'s photos</h1>
      <p>Please verify your email subscription by clicking this link or pasting it into your browser:</p>
        <a href='${verifyLink}'>${verifyLink}</a>
    </body>
    </html>`;

      // The character encoding for the email.
      const charset = 'UTF-8';

      // Specify the parameters to pass to the API.
      let params = {
        Source: sender,
        Destination: {
          ToAddresses: [recipient],
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: charset,
          },
          Body: {
            Text: {
              Data: body_text,
              Charset: charset,
            },
            Html: {
              Data: body_html,
              Charset: charset,
            },
          },
        },
      };

      //Try to send the email.
      ses.sendEmail(params, function (err, data) {
        // If something goes wrong, print an error message.
        if (err) {
          console.log(err.message);
        } else {
          console.log('Email sent! Message ID: ', data.MessageId);
          console.log('data: ', data);
        }
      });

      res.status(200).render('verificationEmailSent');
    }
  });
};

// Guests routed here after clicking verification link
// link query param decrypted into guest info object
// Updates the owner doc in DB with guest info
module.exports.verifyEmail = async (req, res, next) => {
  let guest = JSON.parse(req.query.guest);
  console.log('guest: ', guest);
  guest = decrypt(guest);
  // If decrypt fails (node probably restarted) try subscribing again.
  if (!guest) {
    const gId = req.query.id;
    const subscribeLink = `${process.env.SERVER}/guest/subscribe-email`;
    return res.status(418).render('verificationError', { guestId: gId, subscribeLink: subscribeLink });
  }
  const emailAddress = guest.email;
  const firstName = guest.firstName;
  const lastName = guest.lastName;
  const guestId = guest.guestId;

  User.findOne({ 'subscribers.email.emailAddress': emailAddress }).then((foundUser) => {
    if (foundUser) {
      console.log('foundEmail', foundUser.subscribers.email);
      res.status(200).send('Already verified email');
    }
  });

  User.findOne({ guestId: guestId }).then(async (foundUser) => {
    console.log('foundUser: ', foundUser);
    foundUser.subscribers.email.push({
      firstName: firstName,
      lastName: lastName,
      emailAddress: emailAddress,
    });
    foundUser.markModified('subscribers');
    await foundUser.save(function (err, foundUser) {
      if (err) return console.error(err);
      console.log(foundUser + ' saved.');
    });
    const guestLink = `${process.env.SERVER}/${guestId}/guest`;
    res.status(200).render('emailVerified', { guestLink: guestLink });
  });
};

module.exports.subscribeBrowser = (req, res) => {
  const publicVapidKey = process.env.PUBLIC_VAPID_KEY;
  const privateVapidKey = process.env.PRIVATE_VAPID_KEY;

  webPush.setVapidDetails('mailto:hello@jakepfaf.dev', publicVapidKey, privateVapidKey);

  const subscription = JSON.parse(req.body.subscription);
  const guestId = req.body.guestId;

  // Save subscriptions info to owner doc in DB
  // First need to see if guest has already subscribed
  User.findOne({ guestId: guestId }).then(async (foundUser) => {
    for (const index of foundUser.subscribers.browser) {
      if (index.subscription.keys.auth === subscription.keys.auth) {
        // Subscription found in DB (guest has already subscribed)
        console.log('foundBrowserSub', foundUser.subscribers.browser);
        return res.status(200).send('Already subscribed to browser notifications');
      }
    }
    // Subscription not found in DB; Add to DB
    foundUser.subscribers.browser.push({
      subscription: subscription,
    }),
      foundUser.markModified('subscribers');
    await foundUser.save(function (err, foundUser) {
      if (err) return console.error(err);
      console.log(foundUser.subscribers.browser.subscription + ' saved.');
    });
    res.status(200).send(foundUser.subscribers);
  });
};

const updateTimestamp = async (guestId, timeStamp) => {
  User.findOneAndUpdate({ guestId: guestId }, { lastNotification: timeStamp }, { new: true }, (err, foundDoc) => {
    if (err) {
      console.log('error: ', err);
      return;
    }
  });
};

// Send email notification
module.exports.emailNotification = async (req, res, next) => {
  // Get guestId out of url path
  const guestId = req.body.guestId;
  let owner;
  const timeStamp = toDate(Date.now()); // Convert numerical date to human-readable

  await User.findOne({ guestId: guestId }).then((foundOwner) => {
    const lastNotification = add(foundOwner.lastNotification, { hours: 1 });

    // If last notification+1hr is later than the current timestamp,
    // timeComparison will equal 1 (else -1 or 0)
    const timeComparison = compareAsc(lastNotification, timeStamp);

    // If less than one hour has passed since last notification, do not send another email
    if (timeComparison > 0) {
      console.log('🕑 Email notification sent within last hour');
      foundOwner = null;
    }
    owner = foundOwner;
  });

  if (owner) {
    // await updateTimestamp(guestId, timeStamp);

    //  ---- CODE BELOW SENDS EMAILS
    const sender = `${owner.firstName} ${owner.lastName} (via Carousel) <notification@carousel.jakepfaf.dev>`;

    const subject = `New photo${res.locals.fileCount > 1 ? 's' : ''} shared!`;
    const body_text = `Go see ${res.locals.fileCount === 1 ? 'it' : 'them'}!` + req.body.shareUrl;
    // The HTML body of the email.
    const body_html = `<html>
    <head></head>
    <body>
      <h1>${owner.firstName} ${owner.lastName} just shared ${
      res.locals.fileCount === 1 ? 'a' : res.locals.fileCount
    } new photo${res.locals.fileCount > 1 ? 's' : ''}!</h1>
      <p>Go see ${res.locals.fileCount === 1 ? 'it' : 'them'} here:</p>
        <a href='${process.env.SERVER}/${owner.guestId}/guest'>View Photo${res.locals.fileCount === 1 ? '' : 's'}</a>
        <img src=${res.locals.imgPath} />
    </body>
    </html>`;

    // The character encoding for the email.
    const charset = 'UTF-8';

    // Specify the parameters to pass to the API.
    let params = {
      Source: sender,
      Destination: {
        ToAddresses: [],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: charset,
        },
        Body: {
          Text: {
            Data: body_text,
            Charset: charset,
          },
          Html: {
            Data: body_html,
            Charset: charset,
          },
        },
      },
    };

    // Loop through every subscriber and send an email
    owner.subscribers.email.forEach((obj) => {
      params.Destination.ToAddresses[0] = obj.emailAddress;

      //Try to send the email.
      ses.sendEmail(params, function (err, data) {
        // If something goes wrong, print an error message.
        if (err) {
          console.log('err: ', err.message);
        } else {
          console.log('Email sent! Message ID: ', data.MessageId);
        }
      });
    });
  }
  res.end();
};
