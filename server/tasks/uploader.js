const path = require('path');
const axios = require('axios');
const crypto = require('crypto');
const { uploader, dbWriter } = require('./index');
const sendNotifications = require('../notifications');

const getB2UploadAuth = async (res) => {
  const bucketId = process.env.BUCKET_ID;
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

const addToDbWriterQueue = (data, metadata, resolution, ownerId) => {
  dbWriter.add('dbWriter', {
    fileId: data.fileId,
    fileName: data.fileName,
    metadata,
    resolution: resolution,
    ownerId: ownerId,
  });
};

const upload = async (auth, data, ws) => {
  const userId = data.userId;
  const guestId = data.guestId;
  const resolution = data.resolution;
  const image = data.image;
  const metadata = {
    w: data.image.w,
    h: data.image.h,
    exif: data.image.exif,
  };
  const fileCount = data.fileCount;

  try {
    // Uploads images to B2 storage
    let source = Buffer.from(image.buffer);
    let fileSize = image.size;
    let filename = `${userId}/${resolution.replace('Res', '')}/${path.basename(image.originalname)}`;
    filename = encodeURI(filename);
    let sha1 = crypto.createHash('sha1').update(source).digest('hex');

    const uploadResponse = await axios.post(auth.uploadUrl, source, {
      headers: {
        Authorization: auth.uploadAuthorizationToken,
        'X-Bz-File-Name': filename,
        'Content-Type': 'b2/x-auto',
        'Content-Length': fileSize,
        'X-Bz-Content-Sha1': sha1,
        'X-Bz-Info-Author': 'unknown',
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    if (uploadResponse.data.status === 503) {
      uploader.pause();
      await getB2UploadAuth(data.res);
      uploader.resume();
    }

    const src = process.env.CDN_PATH + filename;
    const thumbnail = process.env.CDN_PATH + filename.replace('/full/', '/thumb/');

    addToDbWriterQueue(uploadResponse.data, metadata, resolution, userId);

    const truncate = (str, truncLen, separator) => {
      if (str.length <= truncLen) return str;

      separator = separator || '...';

      const sepLen = separator.length,
        charsToShow = truncLen - sepLen,
        frontChars = Math.ceil(charsToShow / 2),
        backChars = Math.floor(charsToShow / 2);

      return str.substr(0, frontChars) + separator + str.substr(str.length - backChars);
    };

    const loggingFileName = (str, truncLen) => {
      const filenameArr = str.split('/').slice(1);
      filenameArr[1] = truncate(filenameArr[1], truncLen);
      return filenameArr.reverse().join(' - ');
    };
    success(`Uploaded -- ${loggingFileName(filename, 30)}`);
    return {
      filename,
      src,
      thumbnail,
      metadata,
      status: uploadResponse.status,
    };
  } catch (err) {
    error('err:', err);
  }
};

module.exports = async (req, res) => {
  const ws = req.app.locals.ws;
  try {
    uploader.process('*', async (job) => {
      // Get upload auth token
      const auth = await getB2UploadAuth(res);
      job.data.res = res;
      return upload(auth, job.data, ws);
    });
  } catch (err) {
    error('%O', { err });
  }
  uploader.on('completed', async (job, fileInfo) => {
    if (job.data.resolution === 'fullRes') {
      // Full version uploaded; send notifications
      // const emailSender = require('../tasks/emailSender');
      // emailSender();

      // Send success response to client
      try {
        // console.log('req.app.locals: ', req.app.locals);
        ws.send(
          Buffer.from(
            JSON.stringify({
              ...fileInfo,
              type: 'fileUploaded',
              msg: 'Processing...',
              uppyFileId: req.body.uppyFileId,
            })
          )
        );
      } catch (err) {
        if (!ws) {
          await res.status(200).end();
        }
        error('ws error:', err);
      }
      // res.status(200).json(fileInfo).end();
    } else {
      // Thumbnail is finished uploading - send notifications
      sendNotifications();
    }
  });
};
