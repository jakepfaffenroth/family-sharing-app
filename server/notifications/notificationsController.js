const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
// const { User } = require('../users/userModel');
const db = require('../db').pgPromise;

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

module.exports.sendBrowserNotifications = async (res, userId) => {
  try {
    const result = await db.task(async (t) => {
      const user = await db.one('SELECT first_name, guest_id FROM users WHERE user_id = $1', [userId]);
      const subscriptions = await db.any(
        'SELECT * FROM subscribers WHERE owner_id = ${guestId} AND browser IS NOT NULL',
        user
      );
      return { user, subscriptions };
    });
    if (result.subscriptions.length === 0) {
      return console.log('No browser subscriptions found.');
    }

    const guestId = result.user.guestId;

    console.log('guestId: ', guestId);
    const payload = JSON.stringify({
      title: `${result.user.firstName} just shared ${
        res.locals.fileCount === 1 ? 'a' : res.locals.fileCount
      } new photo${res.locals.fileCount > 1 ? 's' : ''}!`,
      body: `Click to see ${res.locals.fileCount === 1 ? 'it' : 'them'}!`,
      icon: res.locals.imgPath,
      guestId: guestId,
    });

    result.subscriptions.forEach((sub) => {
      const publicVapidKey = process.env.PUBLIC_VAPID_KEY;
      const privateVapidKey = process.env.PRIVATE_VAPID_KEY;

      webPush.setVapidDetails('mailto:notification@carousel.jakepfaf.dev', publicVapidKey, privateVapidKey);

      webPush.sendNotification(sub.browser, payload).catch(async (error) => {
        console.error(error);
        // If 410 response (subscription no longer valid), remove from DB
        if (error.statusCode == 410) {
          console.log('Removing bad sub');
          try {
            const result = await db.task(async (t) => {
              const user = await db.one('SELECT username, guestId FROM users WHERE user_id = $1', [userId]);
              const subscriptions = db.any(
                'SELECT * FROM subscribers WHERE owner_id = ${guestId} AND browser IS NOT NULL',
                user
              );
              const deletedSub = db.one(
                "DELETE FROM subscribers WHERE browser -> 'keys'->>'auth' = ${keys.auth} RETURNING *",
                sub
              );
              if (deletedSub) console.log('Removed' + deletedSub + ' from ' + user.username);
              return { user, subscriptions, deletedSub };
            });
          } catch (err) {
            console.log('Error removing bad browser subscription:', err);
          }
        }
      });
      console.log('Browser notifications sent!');
      return res.end();
    });
  } catch (err) {
    return console.log(err);
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

        // !users.length ? console.log('Bounced email not found in DB') : null;

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
