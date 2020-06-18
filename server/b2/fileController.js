require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { Readable, Writable } = require('stream');

let filePath = '/Users/Jake/Coding Projects/family-photos/server/b2/testFile.txt';

const accountId = process.env.VUE_APP_ACCOUNT_ID;
const applicationKey = process.env.VUE_APP_APPLICATION_KEY;
const bucketId = process.env.VUE_APP_BUCKET_ID;

const encodedBase64 = new Buffer(accountId + ':' + applicationKey).toString('base64');

module.exports.auth = (req, res, next) => {
  let credentials;
  axios
    .post(
      `https://api.backblazeb2.com/b2api/v1/b2_authorize_account`,
      {},
      {
        headers: { Authorization: 'Basic ' + encodedBase64 },
      }
    )
    .then(function(response) {
      const data = response.data;
      credentials = {
        accountId: accountId,
        applicationKey: applicationKey,
        apiUrl: data.apiUrl,
        authorizationToken: data.authorizationToken,
        downloadUrl: data.downloadUrl,
        recommendedPartSize: data.recommendedPartSize,
      };
      res.locals.credentials = credentials;
      console.log(credentials);
      next();
    })
    .catch(function(err) {
      console.log('err: ', err); // an error occurred
    });
};

module.exports.upload = (req, res, next) => {
  const credentials = res.locals.credentials;
  axios
    .post(
      credentials.apiUrl + '/b2api/v1/b2_get_upload_url',
      {
        bucketId: bucketId,
      },
      { headers: { Authorization: credentials.authorizationToken } }
    )
    .then(function(response) {
      var uploadUrl = response.data.uploadUrl;
      var uploadAuthorizationToken = response.data.authorizationToken;
      var source = fs.readFileSync(filePath);
      var fileName = path.basename(filePath);

      var sha1 = crypto
        .createHash('sha1')
        .update(source)
        .digest('hex');

      axios
        .post(uploadUrl, source, {
          headers: {
            Authorization: uploadAuthorizationToken,
            'X-Bz-File-Name': fileName,
            'Content-Type': 'b2/x-auto',
            // 'Content-Length': fileSize,
            'X-Bz-Content-Sha1': sha1,
            'X-Bz-Info-Author': 'unknown',
          },
        })
        .then(function(response) {
          console.log(`Status: ${response.status} - ${response.data.fileName} uploaded`);
          res.send(`Success - ${response.data.fileName} uploaded`); // successful response
        })
        .catch(function(err) {
          console.log(err); // an error occurred
        });
    })
    .catch(function(err) {
      console.log(err); // an error occurred
    });
};


module.exports.download = (req, res) => {
  const credentials = res.locals.credentials;
  const bucketName = process.env.VUE_APP_BUCKET_NAME;
  let fileName = 'testFile.txt';
  let saveToPath = '/Users/Jake/downloads/' + fileName;

  axios
    .get(credentials.downloadUrl + '/file/' + bucketName + '/' + fileName, {
      headers: { Authorization: credentials.authorizationToken },
    })
    .then(function(response) {
      var source = new Readable();
      source._read = function noop() {};
      source.push(response.data);
      source.push(null);

      var destination = fs.createWriteStream(saveToPath);

      source.on('end', function() {
        console.log('File successfully downloaded');
        res.send(`Success - ${fileName} downloaded`); // successful response
      });
      source.pipe(destination);
    })
    .catch(function(err) {
      console.log(err); // an error occurred
    });
};


// TODO - file deletion
// TODO - list all files
// TODO - enable user to choose file with file picker