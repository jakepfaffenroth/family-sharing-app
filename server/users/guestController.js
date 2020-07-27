const mongoose = require('mongoose');
const add = require('date-fns/add');
const toDate = require('date-fns/toDate');
const compareAsc = require('date-fns/compareAsc');
require('dotenv').config();
const User = require('../users/userModel');

const AWS = require('aws-sdk');
const credentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
};
const sns = new AWS.SNS({ credentials: credentials, region: 'us-west-2' });
const ses = new AWS.SES({ credentials: credentials, region: 'us-west-2' });

// Marks the user as a guest
module.exports.mark = (req, res) => {
  // extracts guestId from path
  const guestId = req.path.split('/')[1];
  // Set guestId cookie on client
  res.cookie('guestId', guestId, { maxAge: 1000 * 60 * 60 * 24 * 7 });
  res.redirect(process.env.CLIENT + '?guest=' + guestId);
};

// Subscribes guest to new photos notifications (SMS, email, browser)
module.exports.subscribe = (req, res) => {
  //  ---- CODE BELOW SENDS EMAILS
  const owner = req.body.owner;
  const sender = owner + ' (via Carousel) <notification@carousel.jakepfaf.dev>';
  const recipient = req.body.email;
  const subject = 'I just shared new photos!';
  const body_text = 'Go see them! ' + req.body.shareUrl;

  // The HTML body of the email.
  const body_html = `<html>
<head></head>
<body>
  <h1>${owner} just shared new photos!</h1>
  <p>Go see them here:</p>
    <a href='${req.body.shareUrl}'>View Photos</a>
</body>
</html>`;

  // The character encoding for the email.
  const charset = 'UTF-8';

  // // Create a new SES object.
  // var ses = new ses();

  // Specify the parameters to pass to the API.
  var params = {
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
    }
  });

  // ---- CODE BELOW SUBSCRIBES TO SNS EMAIL (not using any more)

  // let params = {
  //   Protocol: 'EMAIL',
  //   TopicArn: process.env.TOPIC_ARN,
  //   Endpoint: req.body.email,
  // };

  // console.log('params: ', params);

  // sns.subscribe(params, (err, data) => {
  //   if (err) {
  //     console.log(err);
  //   } else {
  //     console.log(data);
  //     res.send(data);
  //   }
  // });
};

const updateTimestamp = async (guestId, timeStamp) => {
  User.findOneAndUpdate({ guestId: guestId }, { lastNotification: timeStamp }, { new: true }, (err, foundDoc) => {
    if (err) {
      console.log('error: ', err);
      return;
    }
  });
};

const checkLastNotification = async (guestId, timeStamp, next) => {
  User.findOne({ guestId: guestId }).then((foundOwner) => {
    const lastNotification = add(foundOwner.lastNotification, { hours: 1 });

    const timeComparison = compareAsc(lastNotification, timeStamp);
    console.log('timeComparison: ', timeComparison);
    if (timeComparison > 0) {
      updateTimestamp(guestId, timeStamp);
      console.log('butt');
      return true;
    }
    const owner = foundOwner;

    return owner;
  });
};

module.exports.emailNotification = async (req, res, next) => {
  const guestId = req.body.files[0].guestId.split('/')[3];
  let owner;
  const timeStamp = toDate(Date.now());

  await User.findOne({ guestId: guestId }).then((foundOwner) => {
    const lastNotification = add(foundOwner.lastNotification, { hours: 1 });
    const timeComparison = compareAsc(lastNotification, timeStamp);

    if (timeComparison > 0) {
      // updateTimestamp(guestId, timeStamp);
      console.log('🕑 Notification sent within last hour');
      foundOwner = null;
    }
    owner = foundOwner;
  });

  if (owner) {
    await updateTimestamp(guestId, timeStamp);

    //  ---- CODE BELOW SENDS EMAILS
    const sender = `${owner.firstName} ${owner.lastName} (via Carousel) <notification@carousel.jakepfaf.dev>`;
    const recipient = req.body.email || 'jakepfaffenroth@gmail.com';
    const subject = 'I just shared new photos!';
    const body_text = 'Go see them! ' + req.body.shareUrl;

    // The HTML body of the email.
    const body_html = `<html>
    <head></head>
    <body>
      <h1>${owner.firstName} ${owner.lastName} just shared new photos!</h1>
      <p>Go see them here:</p>
        <a href='${process.env.CLIENT}/${owner.guestId}/guest'>View Photos</a>
    </body>
    </html>`;

    // The character encoding for the email.
    const charset = 'UTF-8';

    // // Create a new SES object.
    // var ses = new ses();

    // Specify the parameters to pass to the API.
    var params = {
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
      }
    });
    console.log('sender: ', sender);
  }
  res.end();
};
