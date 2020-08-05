require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');
const webPush = require('web-push');
const path = require('path');
const fs = require('fs');
const { Readable, Writable } = require('stream');
const sharp = require('sharp');
const exif = require('exif-reader');
const { User, Image } = require('../users/userModel');

const appKeyId = process.env.VUE_APP_APP_KEY_ID;
const applicationKey = process.env.VUE_APP_APPLICATION_KEY;
const bucketId = process.env.VUE_APP_BUCKET_ID;

const encodedBase64 = Buffer.from(appKeyId + ':' + applicationKey).toString('base64');

// ---- File compression and upload functions
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

const compressImages = async (files, sharpParams) => {
  let count = 0;
  files.files.forEach((fileObject) => {
    const output = sharp(fileObject.buffer);

    return (
      output
        .rotate()
        .resize({
          width: sharpParams.longEdge,
          height: sharpParams.longEdge,
          fit: sharp.fit.inside,
          withoutEnlargement: true,
        })
        // .sharpen()
        .jpeg({ quality: sharpParams.compression })
        .withMetadata()
        .toBuffer()

        .then(function (data) {
          fileObject.buffer = data;
          fileObject.size = data.length;
          count++;
          console.log('✅ ' + count + ' images optimized');
          return files;
        })
        .catch((err, info) => {
          console.log('compression error: ', err, info);
        })
    );
  });
};

const uploadFiles = async (auth, fileObject, req, lowRes) => {
  // Uploads images to B2 storage
  let source = fileObject.buffer;
  let fileSize = fileObject.size;
  let fileName = `${req.body.userId}/${lowRes ? 'small/' : 'full/'}${path.basename(fileObject.originalname)}`;
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

const getImageDimensions = async (file) => {
  const output = sharp(file.buffer);
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
      return exifData;
    })
    .catch((err, info) => {
      console.log('Exif read error: ', err, info);
    });
};

const addToDb = async (uploadResponse, exif, dimensions, req, lowRes) => {
  let fileName = uploadResponse.data.fileName;
  let fileId = uploadResponse.data.fileId;
  let smallFileId = '';

  let uploadTime = Date.now();
  if (lowRes) {
    console.log('req.body: ', req.body);
    const user = await Image.findOne({ _id: req.body.userId, 'images.fileName': fileName }, 'images.$');
    console.log('user1: ', user);
    user.images.$.smallFileId = uploadResponse.fileId;
    console.log('user2: ', user);
    return;
  } // Don't add small versions to DB to avoid duplicates
  const user = await User.findOne({ _id: req.body.userId });
  if (!user.images) {
    user.images = [];
  }
  console.log('user: ', user);
  user.images.push({
    fileId: fileId,
    smallFileId: smallFileId,
    fileName: fileName,
    src: process.env.CDN_PATH + fileName,
    thumbnail: process.env.CDN_PATH + fileName.replace('/full/', '/small/'),
    w: dimensions.w,
    h: dimensions.h,
    exif: exif,
    uploadTime: uploadTime,
  });
  user.markModified('images');
  await user.save(function (err, foundUser) {
    if (err) return console.error(err);
    console.log('Success adding image subdoc to db');
  });

  return {
    fileId: fileId,
    smallFileId: smallFileId,
    fileName: fileName,
    exif: exif,
    uploadTime: uploadTime,
  };
};

const sendBrowserNotifications = async (res, userId) => {
  let subscriptions = [];
  let guestId;
  let owner;

  await User.findById(userId).then((foundUser) => {
    subscriptions = foundUser.subscribers.browser;
    guestId = foundUser.guestId;
    owner = foundUser;
  });

  const payload = JSON.stringify({
    title: `${owner.firstName} just shared ${res.locals.fileCount === 1 ? 'a' : res.locals.fileCount} new photo${
      res.locals.fileCount > 1 ? 's' : ''
    }!`,
    body: `Click to see ${res.locals.fileCount === 1 ? 'it' : 'them'}!`,
    icon: res.locals.imgPath,
    guestId: guestId,
  });

  subscriptions.forEach((obj) => {
    const publicVapidKey = process.env.PUBLIC_VAPID_KEY;
    const privateVapidKey = process.env.PRIVATE_VAPID_KEY;

    webPush.setVapidDetails('mailto:notification@carousel.jakepfaf.dev', publicVapidKey, privateVapidKey);

    webPush.sendNotification(obj.subscription, payload).catch((error) => {
      console.error(error);
      // If 410 response (subscription no longer valid), remove from DB
      if (error.statusCode == 410) {
        console.log('Removing bad sub');
        User.findById(userId).then(async (foundUser) => {
          const base = foundUser.subscribers.browser;
          base.splice(base.indexOf(obj.subscription), 1);
          console.log('indexOf(obj.subscription): ', base.indexOf(obj.subscription));
          foundUser.markModified('subscribers');
          await foundUser.save(function (err, foundUser) {
            if (err) return console.error(err);
            console.log('Removed', obj.subscription);
          });
        });
      }
    });
  });
};

const sendNotifications = async (res, userId) => {
  sendBrowserNotifications(res, userId);
};

const processImages = async (http, auth, files, sharpParams) => {
  // If longEdge is null, image is full res
  const lowRes = sharpParams.longEdge ? true : false;
  await compressImages(files, sharpParams);

  for (const fileObject of files.files) {
    const uploadResponse = await uploadFiles(auth, fileObject, http.req, lowRes);
    const dimensions = await getImageDimensions(fileObject);
    const exif = await getExif(fileObject);
    const fileInfo = await addToDb(uploadResponse, exif, dimensions, http.req, lowRes);

    if (fileInfo) {
      // fileInfo undefined for low res images
      fileInfo.w = dimensions.w;
      fileInfo.h = dimensions.h;
      fileInfo.src = process.env.CDN_PATH + fileInfo.fileName;
      fileInfo.thumbnail = process.env.CDN_PATH + fileInfo.fileName.replace('/full/', '/small/');
      files.finished.push(fileInfo);
    }
  }

  lowRes ? null : (http.res.locals.imgPath = files.finished[0].thumbnail); // store an example image path to use in notifications
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

module.exports.upload = async (req, res, next) => {
  const userId = req.body.userId;
  const files = req.files;
  const finishedFiles = [];
  res.locals.fileCount = req.files.length;

  if (!files) {
    console.log('no images uploaded');
    return next();
  }

  console.log('-------------------------');
  console.log('  STARTING IMAGE UPLOAD  ');
  console.log('-------------------------');
  console.log('Uploading', req.files ? req.files.length : 0, 'images');

  const auth = await getB2Auth(res);

  // Process full res images if enabled
  await processImages(
    { req: req, res: res },
    auth,
    { files: files, finished: finishedFiles },
    { longEdge: null, compression: 100 }
  );
  // Process small versions
  await processImages(
    { req: req, res: res },
    auth,
    { files: files, finished: finishedFiles },
    { longEdge: 800, compression: 80 }
  );

  await sendNotifications(res, userId);

  res.status(200).json(finishedFiles);
  next();
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

module.exports.getStorageSize = async (req, res) => {
  const files = await this.listFiles(req, res);

  let totalStorageUsed = files.reduce((accumulator, currentValue) => accumulator + currentValue.contentLength, 0);

  let kilobytes = (totalStorageUsed / 1024).toFixed(2);
  let megabytes = (kilobytes / 1024).toFixed(2);
  let gigabytes = (megabytes / 1024).toFixed(2);

  res.json([kilobytes + ' KB', megabytes + ' MB', gigabytes + ' GB']);
};
