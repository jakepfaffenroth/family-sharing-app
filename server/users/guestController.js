const crypto = require('crypto');
const key = crypto.randomBytes(32);
const iv = crypto.randomBytes(16);
const webPush = require('web-push');
// require('dotenv').config({ path: './bin/.env' });
const db = require('../db').pgPromise;

const AWS = require('aws-sdk');
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
module.exports.mark = async (req, res) => {
  // extracts guestId from path
  const guestId = req.path.split('/')[1];

  const user = await db.oneOrNone('SELECT guest_id FROM users WHERE guest_id = $1', [guestId]);
  // Set guestId cookie on client
  if (user) {
    res.cookie('guestId', user.guestId, { maxAge: 1000 * 60 * 60 * 24 * 7 });
    res.redirect(process.env.CLIENT + '?guest=' + user.guestId);
  } else {
    res.status(404).end('<div style="text-align: center;"><h1>404 - Not Found</h1> \n <h2>Invalid link</h2></div>');
  }
};

// ---------------------------------------------------
// ------- Guest Subscription and Verification -------

// Sends guests subscription verification emails
module.exports.subscribeEmail = async (req, res) => {
  const { emailSender } = require('../tasks');

  emailSender.add('sendSubscribeEmail', {
    guest: req.body.guest,
  });

  emailSender.process('sendSubscribeEmail', async (job) => {
    await sendSubscribeEmail(job.data.guest);
  });

  const sendSubscribeEmail = async (guest) => {
    // Handle form data if coming from invalid link re-subscribe page
    if (req.body && !req.body.guest) {
      guest = req.body;
    }

    const owner = await db.one('SELECT * FROM users WHERE guest_id = ${guestId}', guest);
    if (owner.length === 0) {
      return console.log('Incorrect ownerId in email subscription.');
    }

    // First need to see if guest has already subscribed
    const email = await db.oneOrNone(
      "SELECT * FROM subscribers WHERE owner_id = ${guestId} AND email ->> 'emailAddress' = ${email}",
      guest
    );
    if (email) {
      console.log('foundEmail', email.emailAddress);
      res.status(200).send('Already subscribed email');
    } else {
      // Email not found in DB (guest hasn't subscribed yet)
      const sender = `Carousel Email Verification <notification@carousel.jakepfaf.dev>`;
      const recipient = guest.email;
      const subject = `Verify your subscription to ${owner.firstName}'s photos`;
      const queryParam = encodeURI(JSON.stringify(encrypt(guest)));
      const verifyLink = `${process.env.SERVER}/guest/verify-email/?guest=${queryParam}&id=${guest.guestId}`;
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
          error(err.message);
        } else {
          success('Verification email sent! Message ID: ', data.MessageId);
        }
      });

      res.status(200).render('verificationEmailSent');
    }
  };
};

// Guests routed here after clicking verification link
// link query param decrypted into guest info object
// Updates the owner doc in DB with guest info
module.exports.verifyEmail = async (req, res, next) => {
  let guest = JSON.parse(req.query.guest);
  guest = decrypt(guest);
  // If decrypt fails (node probably restarted) try subscribing again.
  if (!guest) {
    const gId = req.query.id;
    const subscribeLink = `${process.env.SERVER}/guest/subscribe-email`;
    return res.status(418).render('verificationError', { guestId: gId, subscribeLink: subscribeLink });
  }

  const subscriber = await db.oneOrNone("SELECT * FROM subscribers WHERE email ->> 'email_address' = ${email}", guest);

  if (subscriber) {
    console.log('foundEmail', subscriber.email);
    res.status(200).send('Already verified email');
  }

  const newEmailSubscriber = await db.one('INSERT INTO subscribers (owner_id, email) VALUES ($1, $2)RETURNING *', [
    guest.guestId,
    { firstName: guest.firstName, lastName: guest.lastName, emailAddress: guest.email },
  ]);

  success(newEmailSubscriber.email.emailAddress + ' saved.');

  const guestLink = `${process.env.SERVER}/${guest.guestId}/guest`;

  res.status(200).render('emailVerified', { guestLink: guestLink });
};

module.exports.subscribeBrowser = async (req, res) => {
  const publicVapidKey = process.env.PUBLIC_VAPID_KEY;
  const privateVapidKey = process.env.PRIVATE_VAPID_KEY;

  webPush.setVapidDetails('mailto:hello@jakepfaf.dev', publicVapidKey, privateVapidKey);

  const newSubscription = JSON.parse(req.body.subscription);
  const guestId = req.body.guestId;

  try {
    const subscription = await db.oneOrNone(
      "SELECT * FROM subscribers WHERE owner_id = $1 AND browser -> 'keys' ->> 'auth' = $2",
      [guestId, newSubscription.keys.auth]
    );
    if (subscription) return res.status(200).send('Already subscribed to browser notifications');
    else {
      (async function () {
        const newSub = await db.one('INSERT INTO subscribers (owner_id, browser) VALUES ($1, $2) RETURNING browser', [
          guestId,
          newSubscription,
        ]);
        success('New browser sub saved.');
        return res.status(200).send(newSub);
      })();
    }
  } catch (err) {
    return error(err);
  }
};
