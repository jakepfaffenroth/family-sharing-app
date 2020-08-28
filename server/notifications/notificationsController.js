const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const db = require('../db').pgPromise;

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

module.exports.addToNotifsQueue = async (req, res, next) => {
  if (req.body.initializeUpload) {
    const { guestId, userId, fileCount, sampleImg } = req.body;
    const thumbPath = `${process.env.CDN_PATH}${userId}/thumb/${sampleImg}`;
    const queues = require('../tasks');
    // Add file upload info to email notification queue
    await queues.emailSender.add({
      guestId,
      fileCount,
      thumbPath,
    });
    await queues.browserSender.add({
      userId,
      guestId,
      fileCount,
      thumbPath,
    });
    // res.status(200).json('ok');
  } else {
    next();
  }
};

module.exports.removeBouncedEmail = (req, res) => {
  let body = '';

  req.on('data', (chunk) => {
    body += chunk.toString();
  });

  req.on('end', async () => {
    let payload = JSON.parse(body);
    // console.log('payload: ', payload);

    // Confirm new SNS subscriptions
    if (payload.Type === 'SubscriptionConfirmation') {
      try {
        // Get the Confirm Subscription url from the AWS email
        const url = payload.SubscribeURL;
        // Follow the confirmation link and get the response
        const response = await axios.get(url);
        // Confirmation was successful
        if (response.status == 200) {
          console.log('Yess! We have accepted the confirmation from AWS');
          return res.end('ok');
        } else {
          // Confirmation was not successful
          return console.log('Error processing SNS confirmation email:', response.status, response.statusText);
        }
      } catch (err) {
        console.log('Error processing SNS confirmation email:', err);
      }
    } else {
      // Not an SNS subscription confirmation email
      try {
        let message = JSON.parse(payload.Message);
        // console.log('message: ', message);

        if (message.notificationType !== 'Bounce' && message.bounce.bounceType !== 'Permanent') return res.end('ok');

        const deletedEmail = await db.oneOrNone(
          "DELETE FROM subscribers WHERE email ->> 'email_address' = $1 RETURNING *",
          [message.mail.destination[0]]
        );
        deletedEmail
          ? console.log('Removed', message.mail.destination[0])
          : console.log('Bounced email ' + message.mail.destination[0] + 'not found in db.');
        // const subscribers = await pgpQuery("SELECT FROM subscribers WHERE email ->> 'email_address' = $1", [
        //   message.mail.destination[0],
        // ]);

        // const users = await User.find({
        //   'subscribers.email.emailAddress': message.mail.destination[0],
        // });

        //- !users.length ? console.log('Bounced email not found in DB') : null;

        // // Remove all bounced emails
        // for (const user of users) {
        //   const base = user.subscribers.email;
        //   base.splice(
        //     base.indexOf({
        //       emailAddress: message.mail.destination[0],
        //       firstName: /.*/,
        //       lastName: /.*/,
        //     })
        //   );
        //   user.markModified('subscribers');
        //   await user.save(function (err, foundUser) {
        //     if (err) return console.error(err);
        //     console.log('Removed', message.mail.destination[0]);
        //   });
        res.end('ok');
      } catch (err) {
        console.log('Error processing bounced email:', err);
      }
    }
  });
};
