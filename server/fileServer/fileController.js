require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { Readable, Writable } = require('stream');
const sharp = require('sharp');
const exif = require('exif-reader');
const User = require('../users/userModel');

const appKeyId = process.env.VUE_APP_APP_KEY_ID;
const applicationKey = process.env.VUE_APP_APPLICATION_KEY;
const bucketId = process.env.VUE_APP_BUCKET_ID;

const encodedBase64 = Buffer.from(appKeyId + ':' + applicationKey).toString('base64');

// ---- File compression and upload functions
const compressImages = async (files) => {
  let compFiles = 0;
  files.forEach((fileObject) => {
    const output = sharp(fileObject.buffer);

    return (
      output
        .rotate()
        .resize({ width: 1200, height: 1200, fit: sharp.fit.inside, withoutEnlargement: true })
        // .sharpen()
        .jpeg({ quality: 80 })
        .withMetadata()
        .toBuffer()

        .then(function (data) {
          fileObject.buffer = data;
          fileObject.size = data.length;
          compFiles++;
          console.log('✅ ' + compFiles + ' images optimized');
          return files;
        })
        .catch((err, info) => {
          console.log('compression error: ', err, info);
        })
    );
  });
};
const getB2Auth = async (res) => {
  // Get B2 upload auth
  const credentials = res.locals.credentials;
  let authToken;
  let auth = {
    uploadAuthorizationToken: '',
    uploadUrl: '',
  };
  try {
    // Gets B2 auth token
    authToken = await axios.post(
      credentials.apiUrl + '/b2api/v2/b2_get_upload_url',
      {
        bucketId: bucketId,
      },
      {
        headers: {
          Authorization: credentials.authorizationToken,
        },
      }
    );
    auth.uploadUrl = authToken.data.uploadUrl;
    auth.uploadAuthorizationToken = authToken.data.authorizationToken;
  } catch (err) {
    console.log('Error getting B2 upload token');
  }
  return auth;
};
const uploadFiles = async (auth, fileObject, req) => {
  // Uploads images to B2 storage
  let source = fileObject.buffer;
  let fileSize = fileObject.size;
  let fileName = req.body.userId + '/' + path.basename(fileObject.originalname);
  fileName = encodeURI(fileName);
  let sha1 = crypto.createHash('sha1').update(source).digest('hex');

  const uploadResponse = await axios.post(auth.uploadUrl, source, {
    headers: {
      Authorization: auth.uploadAuthorizationToken,
      'X-Bz-File-Name': fileName,
      'Content-Type': 'b2/x-auto',
      'Content-Length': fileSize,
      'X-Bz-Content-Sha1': sha1,
      'X-Bz-Info-Author': 'unknown',
    },
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });
  console.log(`✅ Status: ${uploadResponse.status} - ${uploadResponse.data.fileName} uploaded`);
  return uploadResponse;
};
const addToDb = async (uploadResponse, exif, dimensions, req) => {
  // Save B2 fileId to user doc in database
  let fileId = uploadResponse.data.fileId;
  let fileName = uploadResponse.data.fileName;
  let uploadTime = Date.now();
  User.findOneAndUpdate(
    { _id: req.body.userId },
    {
      $push: {
        images: {
          fileId: fileId,
          fileName: fileName,
          src: process.env.CDN_PATH + fileName,
          thumbnail: process.env.CDN_PATH + fileName,
          w: dimensions.w,
          h: dimensions.h,
          exif: exif,
          uploadTime: uploadTime
        },
      },
    },
    function (error, success) {
      if (error) {
        console.log('error: ', error);
      }
    }
  );
  return { fileId: fileId, fileName: fileName, exif: exif, uploadTime: uploadTime };
};
const getImageDimensions = async (file) => {
  const output = sharp(file.buffer);
  let dimensions;
  return output.metadata().then(function (metadata) {
    return { w: metadata.width, h: metadata.height };
  });
};

const getExif = async (fileObject) => {
  const output = sharp(fileObject.buffer);
  return output
    .metadata()
    .then(function (metadata) {
      const exifData = exif(metadata.exif);
      console.log('exif: ', exifData);
      return exifData;
    })
    .catch((err, info) => {
      console.log('Exif read error: ', err, info);
    });
};
// ------------------------------------------

module.exports.b2Auth = (req, res, next) => {
  console.log('getting B2 credentials');
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
      console.log('B2 credentials retrieved');
      next();
    })
    .catch(function (err) {
      console.log('err: ', err.response.data); // an error occurred
    });
};

module.exports.upload = async (req, res) => {
  const files = req.files;
  const finishedFiles = [];

  console.log('-------------------------');
  console.log('  STARTING IMAGE UPLOAD  ');
  console.log('-------------------------');
  console.log('Uploading', req.files.length, 'images');

  await compressImages(files);

  for (const fileObject of files) {
    const auth = await getB2Auth(res);
    const uploadResponse = await uploadFiles(auth, fileObject, req);
    const dimensions = await getImageDimensions(fileObject);
    const exif = await getExif(fileObject);
    const fileInfo = await addToDb(uploadResponse, exif, dimensions, req);

    fileInfo.w = dimensions.w;
    fileInfo.h = dimensions.h;
    fileInfo.src = process.env.CDN_PATH + fileInfo.fileName;
    // console.log('fileInfo: ', fileInfo);
    finishedFiles.push(fileInfo);
  }
  res.status(200).json(finishedFiles);
};

module.exports.listFiles = async (req, res, next) => {
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

    res.json(response.data);
  } catch (err) {
    console.log('listFiles error: ', err);
  }
};

module.exports.deleteImage = async (req, res, next) => {
  const credentials = res.locals.credentials;
  const fileId = req.body.fileId;
  const fileName = req.body.fileName;
  const userId = req.body.userId;

  try {
    // Delete image file from B2
    await axios.post(
      credentials.apiUrl + '/b2api/v1/b2_delete_file_version',
      {
        fileName: fileName,
        fileId: fileId,
      },
      { headers: { Authorization: credentials.authorizationToken } }
    );
    // Remove image info from database
    User.findOneAndUpdate({ _id: userId }, { $pull: { images: { fileId: fileId } } }, function (error, success) {
      if (error) {
        console.log('error: ', error);
      }
    });
    console.log('File was successfully deleted');
    res.json('File successfully deleted');
  } catch (err) {
    console.log('Deletion error: ', err); // an error occurred
    res.json('An error occurred during file deletion');
  }
};

// TODO - Downloads corrupt file - encoding problem?
module.exports.download = async (req, res) => {
  const credentials = res.locals.credentials;
  const bucketName = process.env.VUE_APP_BUCKET_NAME;
  let fileName = path.basename(files);
  let saveToPath = '/Users/Jake/downloads/' + fileName;

  try {
    console.log('x', credentials.downloadUrl + '/file/' + bucketName + '/' + fileName);
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
        console.log('File successfully downloaded');
        res.send(`Success - ${fileName} downloaded`); // successful response
      });
      source.pipe(destination);
    })();
  } catch (err) {
    console.log(err); // an error occurred
  }
};

// TODO - file deletion
