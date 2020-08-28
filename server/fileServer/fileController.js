const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { Readable } = require('stream');
const db = require('../db').pgPromise;

const appKeyId = process.env.KEY_ID;
const applicationKey = process.env.APPLICATION_KEY;
const bucketId = process.env.BUCKET_ID;

const encodedBase64 = Buffer.from(appKeyId + ':' + applicationKey).toString('base64');

module.exports.b2Auth = async (req, res, next) => {
  let credentials;
  axios
    .post(
      `https://api.backblazeb2.com/b2api/v2/b2_authorize_account`,
      {},
      {
        headers: { Authorization: 'Basic ' + encodedBase64 },
      }
    )
    .then(function (response) {
      const data = response.data;
      credentials = {
        appKeyId: appKeyId,
        applicationKey: applicationKey,
        apiUrl: data.apiUrl,
        authorizationToken: data.authorizationToken,
        downloadUrl: data.downloadUrl,
        recommendedPartSize: data.recommendedPartSize,
      };
      res.locals.credentials = credentials;
      success('B2 credentials retrieved');
      next();
    })
    .catch(function (err) {
      error('err: ', err.response.data); // an error occurred
    });
};

module.exports.listFiles = async (req, res) => {
  const apiUrl = res.locals.credentials.apiUrl;
  const authToken = res.locals.credentials.authorizationToken;
  const filePrefix = req.body.filePrefix;
  try {
    const response = await axios({
      method: 'POST',
      url: apiUrl + '/b2api/v2/b2_list_file_names',
      headers: {
        Authorization: authToken,
        'Content-Type': 'application/json; charset=utf-8',
      },
      data: {
        bucketId: bucketId,
        prefix: filePrefix + '/',
      },
    });

    return response.data.files;
    // res.json(response.data);
  } catch (err) {
    error('listFiles error: ', err);
  }
};

module.exports.deleteImage = async (req, res, next) => {
  const credentials = res.locals.credentials;

  const deleteImage = async (image) => {
    let data;
    // Remove image info from database
    try {
      await db.task(async (t) => {
        data = await t.one(
          'SELECT file_id, small_file_id FROM images WHERE owner_id = ${userId} AND file_id = ${fileId}',
          image
        );
        await t.none('DELETE FROM images WHERE owner_id = ${userId} AND file_id = ${fileId}', image);
      });
      success('File was successfully removed from db');
      // res.end('File successfully deleted');
    } catch (err) {
      error('Image db deletion error:\n', err);
      res.status(500).json('An error occurred during file deletion');
    }

    try {
      // Delete full res image file from B2
      await axios.post(
        credentials.apiUrl + '/b2api/v1/b2_delete_file_version',
        {
          fileName: image.fileName,
          fileId: image.fileId,
        },
        { headers: { Authorization: credentials.authorizationToken } }
      );
      // Delete small image file from B2
      await axios.post(
        credentials.apiUrl + '/b2api/v1/b2_delete_file_version',
        {
          fileName: image.fileName.replace('/full/', '/thumb/'),
          fileId: data.smallFileId,
        },
        { headers: { Authorization: credentials.authorizationToken } }
      );
      success('File was successfully deleted from B2');
    } catch (err) {
      error('Error deleting file from B2:', err.response.data.message);
      if (err.response.data.code !== 'file_not_present') {
        // return res.json('An error occurred during file deletion');
        return;
      }
    }
  };

  // Deletes single image
  if (!req.body.images) {
    return deleteImage(req.body);
  }

  // Deletes multiple images
  req.body.images.forEach((image) => {
    deleteImage({ fileId: image.fileId, fileName: image.fileName, userId: req.body.userId });
  });
  res.status(200).json('Deleted');
};

// TODO - Downloads corrupt file - encoding problem?
module.exports.download = async (req, res) => {
  const credentials = res.locals.credentials;
  const bucketName = process.env.BUCKET_NAME;
  let fileName = path.basename(files);
  let saveToPath = '/Users/Jake/downloads/' + fileName;

  try {
    // GET image file from B2
    const downloadResponse = await axios.get(credentials.downloadUrl + '/file/' + bucketName + '/' + fileName, {
      headers: { Authorization: credentials.authorizationToken },
      responseType: 'stream',
    });
    // Write image file
    (function () {
      const source = new Readable();
      source._read = function noop() {};
      source.push(downloadResponse.data);
      source.push(null);

      const destination = fs.createWriteStream(saveToPath);

      source.on('end', function () {
        success('File successfully downloaded');
        res.send(`Success - ${fileName} downloaded`); // successful response
      });
      source.pipe(destination);
    })();
  } catch (err) {
    error(err); // an error occurred
  }
};

module.exports.getStorageSize = async (req, res) => {
  const files = await this.listFiles(req, res);

  let totalStorageUsed = files.reduce((accumulator, currentValue) => accumulator + currentValue.contentLength, 0);

  let kilobytes = (totalStorageUsed / 1024).toFixed(2);
  let megabytes = (kilobytes / 1024).toFixed(2);
  let gigabytes = (megabytes / 1024).toFixed(2);

  res.json([kilobytes + ' KB', megabytes + ' MB', gigabytes + ' GB']);
};

module.exports.imgHandler = async (req, res, next) => {
  const { guestId, userId, shareUrl, uppyFileId } = req.body;
  const credentials = res.locals.credentials;
  const images = req.files;
  const thumbPath = `${process.env.CDN_PATH}${userId}/thumb/${images[0].originalname}`;
  const fileCount = images.length;
  const { getB2Auth, imgCompressor, uploader } = require('../tasks');

  // Files have reached server so send success response
  // info('Received ' + images[0].originalname);
  // if (images) {
  //   res.status(200).json({ msg: 'File arrived. Processing...', file: images[0].originalname });
  // } else {
  //   error('No files reached server');
  //   res.status(500).json('Error uploading files');
  // }

  const jobs = {};

  // Add the images to the processing flow
  const newJob = await imgCompressor.add({
    images,
    guestId,
    userId,
    shareUrl,
    credentials,
    uppyFileId,
  });

  jobs[newJob.id] = { req, res };

  // TODO - job returned by uploader completion is a different job from newJob created above
  // TODO - Need to pass original newJob job id to uploader
  uploader.on('completed', (job, result) => {
    // if (job.data.resolution === 'thumbRes') {
    if (jobs[job.id]) {
      const res = jobs[job.id].res;
      res.status(200).json(result);
      // delete jobs[j];
    }
    // }
  });
};
