const AWS = require('aws-sdk');
const credentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
};
const ses = new AWS.SES({ credentials: credentials, region: 'us-west-2' });

module.exports = async (
  { sender, recipient, subject, body_text, body_html },
  res
) => {
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

  //Try to send the email.
  let err = null;
  const AWSResponse = await ses
    .sendEmail(params)
    .promise((error) => (err = error));
  if (err) console.error(err);
  return !!AWSResponse;
};
