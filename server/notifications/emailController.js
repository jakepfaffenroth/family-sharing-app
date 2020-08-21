const add = require('date-fns/add');
const toDate = require('date-fns/toDate');
const compareAsc = require('date-fns/compareAsc');
const db = require('../db').pgPromise;
const crypto = require('crypto');
const AWS = require('aws-sdk');
const credentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
};
const ses = new AWS.SES({ credentials: credentials, region: 'us-west-2' });

// Send email notification
module.exports.sendEmailNotifications = async (data) => {
  const { guestId, fileCount, imgPath } = data;
  // Get guestId out of url path
  // const guestId = data.guestId;
  // const fileCount = data.fileCount;
  // const imgPath = data.imgPath;
  const timeStamp = toDate(Date.now()); // Convert numerical date to human-readable

  const user = await db.one('SELECT * FROM users WHERE guest_id = $1', [guestId]);

  // If last notification+1hr is later than the current timestamp,
  // timeComparison will equal 1 (else -1 or 0)
  const lastNotification = add(user.lastNotification, { hours: 1 });
  const timeComparison = compareAsc(lastNotification, timeStamp);
  // If less than one hour has passed since last notification, do not send another email
  if (timeComparison > 0) {
    console.log('\n🕑 Email notification sent within last hour\n');
    return;
  }

  if (user) {
    // ------------ TURN OFF FOR DEV ------------
    // await updateTimestamp(guestId, timeStamp);
    // ------------------------------------------

    // ---- CODE BELOW SENDS EMAILS  ----
    const sender = `${user.firstName} ${user.lastName} (via Carousel) <notification@carousel.jakepfaf.dev>`;
    const subject = `New photo${fileCount > 1 ? 's' : ''} shared!`;
    const body_text = `Go see ${fileCount === 1 ? 'it' : 'them'}!` + data.shareUrl;
    const charset = 'UTF-8'; // The character encoding for the email.
    // The HTML body of the email.
    const body_html = `<html>
    <head></head>
    <body>
      <h1>${user.firstName} ${user.lastName} just shared ${fileCount === 1 ? 'a' : fileCount} new photo${
      fileCount > 1 ? 's' : ''
    }!</h1>
      <p>Go see ${fileCount === 1 ? 'it' : 'them'} here:</p>
        <a href='${process.env.SERVER}/${user.guest_id}/guest'>View Photo${fileCount === 1 ? '' : 's'}</a>
        <img src=${imgPath} />
    </body>
    </html>`;

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

    // Get email subscribers and send email to each
    await db.each('SELECT email FROM subscribers WHERE owner_id = ${guestId} AND email IS NOT NULL', data, (row) => {
      params.Destination.ToAddresses[0] = row.email.emailAddress;

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
};
