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

      if (payload.Type === 'SubscriptionConfirmation') {
        const promise = new Promise((resolve, reject) => {
          const url = payload.SubscribeURL

          axios(url, (error, response) => {
            if (!error && response.statusCode == 200) {
              console.log('Yess! We have accepted the confirmation from AWS')
              return resolve()
            } else {
              return reject()
            }
          })
        })

        promise.then(() => {
          res.end("ok")
        })
      }
    })
  
    console.log('req: ', req.body.SubscribeURL);
    console.log('req: ', req);

  };