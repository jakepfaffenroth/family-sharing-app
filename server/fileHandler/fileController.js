const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { Readable, pipeline } = require('stream');
const db = require('../db').pgPromise;

const appKeyId = process.env.KEY_ID;
const applicationKey = process.env.APPLICATION_KEY;
const bucketId = process.env.BUCKET_ID;

const encodedBase64 = Buffer.from(appKeyId + ':' + applicationKey).toString(
  'base64'
);

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
          'SELECT file_id, small_file_id FROM images WHERE owner_id = ${ownerId} AND file_id = ${fileId}',
          image
        );
        await t.none(
          'DELETE FROM images WHERE owner_id = ${ownerId} AND file_id = ${fileId}',
          image
        );
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
          fileName: decodeURI(image.fileName),
          fileId: image.fileId,
        },
        { headers: { Authorization: credentials.authorizationToken } }
      );
      // Delete small image file from B2
      await axios.post(
        credentials.apiUrl + '/b2api/v1/b2_delete_file_version',
        {
          fileName: decodeURI(image.fileName).replace('/full/', '/thumb/'),
          fileId: data.smallFileId,
        },
        { headers: { Authorization: credentials.authorizationToken } }
      );
      success('File was successfully deleted from B2');
    } catch (err) {
      error('Error deleting file from B2:', err);
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
    deleteImage({
      fileId: image.fileId,
      fileName: image.fileName,
      ownerId: req.body.ownerId,
    });
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
    const downloadResponse = await axios.get(
      credentials.downloadUrl + '/file/' + bucketName + '/' + fileName,
      {
        headers: { Authorization: credentials.authorizationToken },
        responseType: 'stream',
      }
    );
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

  let totalStorageUsed = files.reduce(
    (accumulator, currentValue) => accumulator + currentValue.contentLength,
    0
  );

  let kilobytes = (totalStorageUsed / 1024).toFixed(2);
  let megabytes = (kilobytes / 1024).toFixed(2);
  let gigabytes = (megabytes / 1024).toFixed(2);

  res.json([kilobytes + ' KB', megabytes + ' MB', gigabytes + ' GB']);
};

// Logic for handling incoming file and compressing
module.exports.imgCompressor = async (req, res, next) => {
  const { premiumUser } = await db.one(
    'SELECT premium_user FROM owners WHERE owner_id = ${id}',
    req.headers
  );

  premiumUser === null ? console.log('no owner found...') : null;

  const credentials = res.locals.credentials;
  const { uploader } = require('../tasks');

  const sharp = require('sharp');
  const exif = require('exif-reader');
  const Busboy = require('busboy');
  const busboy = new Busboy({ headers: req.headers });

  const fields = {};
  const compResults = { orig: 0 };

  const imgFlow = sharp({ sequentialRead: true }).withMetadata();

  req.pipe(busboy);

  busboy.on(
    'field',
    (fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) => {
      fields[fieldname] = val;
    }
  );

  busboy.on('file', async (fieldname, file, filename, encoding, mimetype) => {
    info('File [' + filename + '] Started');

    fields.filename = filename;
    const chunks = [];

    // If premium user, fullRes image chunks are streamed straight into an array
    if (premiumUser) {
      file.on('data', (data) => {
        chunks.push(data);
      });
    }
    pipeline(file, imgFlow, (err) => {
      if (err) {
        error(err);
      }
    });

    file.on('data', (data) => {
      compResults.orig += data.length;
    });
    file.on('end', async () => {
      // If premium user, create buffer from the array of chunks
      // get the metadata like normal, and pass it on to next step
      if (premiumUser) {
        const fullResBuffer = Buffer.concat(chunks);
        const { format, size, width, height, exif } = await getMetadata(
          fullResBuffer
        );
        const info = { format, size, width, height, exif };
        receiveCompImgs(fullResBuffer, 'fullRes', info);
      }
      info('File [' + filename + '] Finished');
      res.json('test');
    });
  });

  // busboy.on('finish', () => {
  //   console.log('busboy finished');
  // });

  busboy.on('error', (err) => {
    error('busboy error:\n', err);
  });

  // if not a premium user, resize to 1200px long edge and quality:80
  if (!premiumUser) {
    imgFlow
      .clone()
      .resize({
        width: 1200,
        height: 1200,
        fit: sharp.fit.inside,
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80 })
      .toBuffer(async (err, compFullResBuffer) => {
        if (err) {
          error(err);
        }

        const { format, size, width, height, exif } = await getMetadata(
          compFullResBuffer
        );
        const info = { format, size, width, height, exif };
        receiveCompImgs(compFullResBuffer, 'fullRes', info);
      });
  }

  imgFlow
    .clone()
    .resize({
      width: 600,
      height: 600,
      fit: sharp.fit.inside,
      withoutEnlargement: true,
    })
    .jpeg({ quality: 80 })
    .toBuffer(async (err, thumbResBuffer, { format, size, width, height }) => {
      if (err) {
        error(err);
      }
      receiveCompImgs(thumbResBuffer, 'thumbRes', {
        format,
        size,
        width,
        height,
      });
    });

  imgFlow.on('error', (err) => {
    error('imgFlow error:\n', err);
  });

  async function getMetadata(image) {
    const metadata = await sharp(image).metadata();
    return metadata.exif
      ? { ...metadata, exif: exif(metadata.exif) }
      : metadata;
  }

  async function addToUploadQueue(resolutionStr, processedImg, data) {
    const {
      guestId,
      ownerId,
      shareUrl,
      credentials,
      uppyFileId,
      fileCount,
    } = data;
    await uploader.add({
      image: processedImg,
      resolution: resolutionStr,
      guestId,
      ownerId,
      fileCount,
      shareUrl,
      credentials,
      uppyFileId,
    });
  }

  async function markCompDone() {
    const getFileSize = (input) => {
      return input / 1024 > 1024
        ? (input / 1024 / 1024).toFixed(2) + ' mb'
        : (input / 1024).toFixed(2) + ' kb';
    };

    const truncate = (filename, truncLen, separator) => {
      if (filename.length <= truncLen) return filename;

      separator = separator || '...';

      const sepLen = separator.length,
        charsToShow = truncLen - sepLen,
        frontChars = Math.ceil(charsToShow / 2),
        backChars = Math.floor(charsToShow / 2);

      return (
        filename.substr(0, frontChars) +
        separator +
        filename.substr(filename.length - backChars)
      );
    };

    success(`Compressed -- ${truncate(fields.filename, 30)}
      from ${getFileSize(compResults.orig)} (orig)
        to ${getFileSize(compResults.fullRes)} (full) ${
      premiumUser ? '(premium)' : ''
    }
        and ${getFileSize(compResults.thumbRes)} (thumb)`);
  }

  async function receiveCompImgs(image, resolutionStr, info) {
    compResults[resolutionStr] = info.size;
    const data = {
      ...fields,
      credentials,
    };
    if (compResults.fullRes && compResults.thumbRes) {
      markCompDone();
    }

    // Compressed version is finished; Add to upload queue.
    await addToUploadQueue(
      resolutionStr,
      {
        name: data.name,
        size: info.size,
        buffer: image,
        w: info.width,
        h: info.height,
        exif: info.exif,
      },
      data // guestId, ownerId, shareUrl, credentials, uppyFileId, fileCount
    );
  }
};
