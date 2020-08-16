require('dotenv').config();
const axios = require('axios');
const crypto = require('crypto');
const webPush = require('web-push');
const path = require('path');
const fs = require('fs');
const { Readable, Writable } = require('stream');
const sharp = require('sharp');
const exif = require('exif-reader');
const db = require('../db').pgPromise;

const appKeyId = process.env.KEY_ID;
const applicationKey = process.env.APPLICATION_KEY;
const bucketId = process.env.BUCKET_ID;

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

const compressImages = async (http, files, sharpParams) => {
  console.log('test', files);
  const ws = http.req.app.locals.ws;

  let count = 0;

  files.files.forEach(async (fileObject) => {
    if (sharpParams.compression != 100) {
      ws.send(
        Buffer.from(
          JSON.stringify({
            type: 'statusUpdate',
            msg: 'Generating thumbnail...',
            uppyFileId: http.req.body.uppyFileId,
            filename: fileObject.originalname,
          })
        )
      );
    }
    const output = sharp(fileObject.buffer);

    // let imageStreamFull, imageStreamSmall;
    // const pipeline = sharp().rotate().withMetadata();
    // pipeline.clone().jpeg().pipe(imageStreamFull);
    // pipeline
    //   .clone()
    //   .resize({
    //     width: 800,
    //     height: 800,
    //     fit: sharp.fit.inside,
    //     withoutEnlargement: true
    //   })
    //   .jpeg({ quality: 80 })
    //   .pipe(imageStreamSmall);
    // fileObject.buffer.pipe(pipeline);

    // console.log('imageStreamFull: ', imageStreamFull);
    // console.log('imageStreamSmall: ', imageStreamSmall);
    // return

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

const uploadFiles = async (auth, fileObject, req, isLowRes) => {
  const ws = req.app.locals.ws;
  isLowRes
    ? null
    : ws.send(
        Buffer.from(JSON.stringify({ type: 'statusUpdate', msg: 'Saving image...', uppyFileId: req.body.uppyFileId,
            filename: fileObject.originalname, }))
      );
  // Uploads images to B2 storage
  let source = fileObject.buffer;
  let fileSize = fileObject.size;
  let fileName = `${req.body.userId}/${isLowRes ? 'small/' : 'full/'}${path.basename(fileObject.originalname)}`;
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

const addToDb = async (uploadResponse, exif, dimensions, req, isLowRes) => {
  let fileName = uploadResponse.data.fileName;
  let uploadTime = Date.now();

  const imageInfo = {
    userId: req.body.userId,
    fileId: uploadResponse.data.fileId,
    fileName: uploadResponse.data.fileName,
    smallFileId: '',
    src: process.env.CDN_PATH + fileName,
    thumbnail: process.env.CDN_PATH + fileName.replace('/full/', '/small/'),
    w: dimensions.w,
    h: dimensions.h,
    exif: exif,
    uploadTime: uploadTime,
  };

  if (isLowRes) {
    try {
      imageInfo.smallFileId = imageInfo.fileId;
      imageInfo.fileName = imageInfo.fileName.replace('/small/', '/full/');
      // Find the full size uploaded image. Gets most recent upload in case multiple with same filename exist.
      const result = await db.one(
        'UPDATE images SET small_file_id = ${fileId} WHERE image_id = (SELECT image_id FROM images WHERE file_name = ${fileName} AND owner_id = ${userId} ORDER BY image_id DESC LIMIT 1) RETURNING *',
        imageInfo
      );
    } catch (err) {
      console.log(err);
      return;
    }
  }

  if (!isLowRes) {
    try {
      const image = await db.one(
        'INSERT INTO images (file_id, file_name, src, thumbnail, w, h, exif, upload_time, owner_id) VALUES (${fileId}, ${fileName}, ${src}, ${thumbnail}, ${w}, ${h}, ${exif}, ${uploadTime}, ${userId}) RETURNING *',
        imageInfo
      );
      if (image) console.log('Success adding image to db:', image.fileName);
    } catch (err) {
      console.log('Error adding image to db');
      return console.error(err);
    }
  }

  return {
    fileId: imageInfo.fileId,
    smallFileId: imageInfo.smallFileId,
    fileName: imageInfo.fileName,
    exif: imageInfo.exif,
    uploadTime: imageInfo.uploadTime,
  };
};

const sendBrowserNotifications = async (res, userId) => {
  try {
    const result = await db.task(async (t) => {
      const user = await db.one('SELECT first_name, guest_id FROM users WHERE user_id = $1', [userId]);
      const subscriptions = await db.any(
        'SELECT * FROM subscribers WHERE owner_id = ${guestId} AND browser IS NOT NULL',
        user
      );
      return { user, subscriptions };
    });

    if (result.subscriptions.length === 0) {
      return console.log('No browser subscriptions found.');
    }

    const guestId = result.user.guestId;

    const payload = JSON.stringify({
      title: `${result.user.firstName} just shared ${
        res.locals.fileCount === 1 ? 'a' : res.locals.fileCount
      } new photo${res.locals.fileCount > 1 ? 's' : ''}!`,
      body: `Click to see ${res.locals.fileCount === 1 ? 'it' : 'them'}!`,
      icon: res.locals.imgPath,
      guestId: guestId,
    });

    result.subscriptions.forEach((sub) => {
      const publicVapidKey = process.env.PUBLIC_VAPID_KEY;
      const privateVapidKey = process.env.PRIVATE_VAPID_KEY;

      webPush.setVapidDetails('mailto:notification@carousel.jakepfaf.dev', publicVapidKey, privateVapidKey);

      webPush.sendNotification(sub.browser, payload).catch(async (error) => {
        console.error(error);
        // If 410 response (subscription no longer valid), remove from DB
        if (error.statusCode == 410) {
          console.log('Removing bad sub');
          try {
            const result = await db.task(async (t) => {
              const user = await db.one('SELECT username, guestId FROM users WHERE user_id = $1', [userId]);
              const subscriptions = db.any(
                'SELECT * FROM subscribers WHERE owner_id = ${guestId} AND browser IS NOT NULL',
                user
              );
              const deletedSub = db.one(
                "DELETE FROM subscribers WHERE browser -> 'keys'->>'auth' = ${keys.auth} RETURNING *",
                sub
              );
              if (deletedSub) console.log('Removed' + deletedSub + ' from ' + user.username);
              return { user, subscriptions, deletedSub };
            });
          } catch (err) {
            console.log('Error removing bad browser subscription:', err);
          }
        }
      });
      console.log('Browser notifications sent!');
      return res.end();
    });
  } catch (err) {
    return console.log(err);
  }
};

const sendNotifications = async (res, userId) => {
  sendBrowserNotifications(res, userId);
};

const processImages = async (http, auth, files, sharpParams) => {
  const ws = http.req.app.locals.ws;
  // If longEdge is null, image is full res
  const isLowRes = sharpParams.longEdge ? true : false;
  // isLowRes ? ws.send(Buffer.from(JSON.stringify({ type: 'statusUpdate', msg: 'Generating thumbnail...', uppyFileId: http.req.body.uppyFileId }))); : null;
  await compressImages(http, files, sharpParams);

  for (const fileObject of files.files) {
    // console.log('http.req.body: ', http.req.body);
    // console.log('fileObject: ', typeof fileObject, fileObject);
    const uploadResponse = await uploadFiles(auth, fileObject, http.req, isLowRes);
    const dimensions = await getImageDimensions(fileObject);
    const exif = await getExif(fileObject);
    const fileInfo = await addToDb(uploadResponse, exif, dimensions, http.req, isLowRes);

    if (fileInfo && isLowRes) {
      // fileInfo undefined for low res images
      // Only send small image info (complete info) to client (via files.finished)
      fileInfo.w = dimensions.w;
      fileInfo.h = dimensions.h;
      fileInfo.src = process.env.CDN_PATH + fileInfo.fileName;
      fileInfo.thumbnail = process.env.CDN_PATH + fileInfo.fileName.replace('/full/', '/small/');
      files.finished.push(fileInfo);

      ws.send(
        Buffer.from(
          JSON.stringify({ type: 'fileFinished', uppyFileId: http.req.body.uppyFileId, filename: fileObject.originalname })
        )
      );
    }
    // if (fileInfo && !isLowRes) {
    //   ws.send(`File ${files.files.indexOf(fileObject)+1} of ${files.files.length} complete`);
    // }
  }

  isLowRes ? (http.res.locals.imgPath = files.finished[0].thumbnail) : null; // Store an example image path to use in notifications;
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
  const ws = req.app.locals.ws;
  req.files.forEach((file) => {
    ws.send(
      Buffer.from(
        JSON.stringify({
          type: 'fileUploaded',
          msg: 'Processing...',
          uppyFileId: req.body.uppyFileId,
          filename: file.originalname,
        })
      )
    );
  });
res.status(200).end()
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

  sendNotifications(res, userId);
  await ws.on('message', (message) => {
    console.log(`Received message => ${message.length < 100 ? message : '(long message)'}`);
  });
  // res.status(200).json(finishedFiles);
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

  const deleteImage = async (image) => {
    console.log('image: ', image);
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
      console.log('File was successfully removed from db');
      // res.end('File successfully deleted');
    } catch (err) {
      console.log('Image db deletion error');
      res.end('An error occurred during file deletion');
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
          fileName: image.fileName.replace('/full/', '/small/'),
          fileId: data.smallFileId,
        },
        { headers: { Authorization: credentials.authorizationToken } }
      );
      console.log('File was successfully deleted from B2');
    } catch (err) {
      console.log('Error deleting file from B2:', err.response.data.message);
      if (err.response.data.code !== 'file_not_present') {
        return res.json('An error occurred during file deletion');
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
};

// TODO - Downloads corrupt file - encoding problem?
module.exports.download = async (req, res) => {
  const credentials = res.locals.credentials;
  const bucketName = process.env.BUCKET_NAME;
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
