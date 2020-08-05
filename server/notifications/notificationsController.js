const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const { User } = require('../users/userModel');

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

module.exports.removeBouncedEmail = (req, res) => {
  let body = '';

  req.on('data', (chunk) => {
    body += chunk.toString();
  });

  req.on('end', async () => {
    let payload = JSON.parse(body);
    // console.log('payload: ', payload);

    // Confirm new SNS subscriptions
    try {
      if (payload.Type === 'SubscriptionConfirmation') {
        const promise = new Promise((resolve, reject) => {
          const url = payload.SubscribeURL;

          axios(url, (error, response) => {
            if (!error && response.statusCode == 200) {
              console.log('Yess! We have accepted the confirmation from AWS');
              return resolve();
            } else {
              console.log('error!');
              return reject();
            }
          });
        });

        promise.then(() => {
          res.end('ok');
        });
      }
    } catch (err) {
      console.log('Error processing SNS confirmation email:', err);
    }
    try {
      let message = JSON.parse(payload.Message);

      // console.log('message: ', message);

      if (message.notificationType !== 'Bounce' && message.bounce.bounceType !== 'Permanent') return res.end('ok');

      const users = await User.find({
        'subscribers.email.emailAddress': message.mail.destination[0],
      });

      !users.length ? console.log('Bounced email not found in DB') : null;

      // Remove all bounced emails
      for (const user of users) {
        const base = user.subscribers.email;
        base.splice(
          base.indexOf({
            emailAddress: message.mail.destination[0],
            firstName: /.*/,
            lastName: /.*/,
          })
        );
        user.markModified('subscribers');
        await user.save(function (err, foundUser) {
          if (err) return console.error(err);
          console.log('Removed', message.mail.destination[0]);
        });
      }
      res.end('ok');
    } catch (err) {
      console.log('Error processing bounced email:', err);
    }
  });
};
