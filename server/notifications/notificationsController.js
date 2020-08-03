const express = require('express')
const bodyParser = require('body-parser');
const axios = require('axios')
const app = express()
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

module.exports.removeBouncedEmail = async (req, res) => {
    let body = ''

    req.on('data', (chunk) => {
      body += chunk.toString()
    })

    req.on('end', () => {
      let payload = JSON.parse(body)
      let message = JSON.parse(payload.Message)
      console.log('payload: ', payload);
      console.log('message: ', message);
      
      if (payload.message.notificationType === 'Bounce' && payload.message.bounce.bounceType === 'Permanent') {
  console.log(`Now I remove the subscriber (${payload.message.mail.destination}) from the DB`)
}

// let payload = {Type:null}
      // console.log(JSON.parse(`{"notificationType":"Bounce","bounce":{"bounceType":"Permanent","bounceSubType":"OnAccountSuppressionList","bouncedRecipients":[{"emailAddress":"s@jakepfaf.dev","action":"failed","status":"5.1.1","diagnosticCode":"Amazon SES did not send the message to this address because it is on the suppression list for your account. For more information about removing addresses from the suppression list, see the Amazon SES Developer Guide at https://docs.aws.amazon.com/ses/latest/DeveloperGuide/sending-email-suppression-list.html"}],"timestamp":"2020-08-03T19:52:08.880Z","feedbackId":"01010173b5e19d79-835db8a5-03d9-4acb-baa6-c0b722acb015-000000","reportingMTA":"dns; amazonses.com"},"mail":{"timestamp":"2020-08-03T19:52:08.880Z","source":"Carousel Email Verification <notification@carousel.jakepfaf.dev>","sourceArn":"arn:aws:ses:us-west-2:363900306919:identity/carousel.jakepfaf.dev","sourceIp":"67.168.93.10","sendingAccountId":"363900306919","messageId":"01010173b5e19c9e-2ab453f1-7d94-4c93-b60d-fbe2af3096c5-000000","destination":["s@jakepfaf.dev"],"headersTruncated":false,"headers":[{"name":"From","value":"Carousel Email Verification <notification@carousel.jakepfaf.dev>"},{"name":"To","value":"s@jakepfaf.dev"},{"name":"Subject","value":"Verify your subscription to Test's photos"},{"name":"MIME-Version","value":"1.0"},{"name":"Content-Type","value":"multipart/alternative;  boundary=\\"----=_Part_12046994_1320367358.1596484328608\\""}],"commonHeaders":{"from":["Carousel Email Verification <notification@carousel.jakepfaf.dev>"],"to":["s@jakepfaf.dev"],"subject":"Verify your subscription to Test's photos"}}}`))
      
// Confirm new SNS subscriptions
      if (payload.Type === 'SubscriptionConfirmation') {
        const promise = new Promise((resolve, reject) => {
          const url = payload.SubscribeURL

          axios(url, (error, response) => {
            if (!error && response.statusCode == 200) {
              console.log('Yess! We have accepted the confirmation from AWS')
              return resolve()
            } else {
              console.log('error!')
              return reject()
            }
          })
        })

        promise.then(() => {
          res.end("ok")
        })
      }
    })
  

  };