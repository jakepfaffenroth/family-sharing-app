const AWS = require('aws-sdk');
const credentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
};
const ses = new AWS.SES({ credentials: credentials, region: 'us-west-2' });

module.exports = ({ sender, recipient, subject, body_text, body_html }) => {
  const params = {
    Source: sender + ' ' + '<notification@carousel.jakepfaf.dev>',
    Destination: {
      ToAddresses: [recipient],
    },
    Message: {
      Subject: {
        Data: subject,
        Charset: 'UTF-8',
      },
      Body: {
        Text: {
          Data: body_text,
          Charset: 'UTF-8',
        },
        Html: {
          Data: body_html,
          Charset: 'UTF-8',
        },
      },
    },
  };
  console.log('params:', params.Message.Body.Html);
  //Try to send the email.
  ses.sendEmail(params, function (err, data) {
    // If something goes wrong, print an error message.
    if (err) {
      error(err);
    } else {
      success('Verification email sent: Message ID: ', data.MessageId);
    }
  });
};
