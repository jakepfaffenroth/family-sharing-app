const path = require('path');
const axios = require('axios');
const crypto = require('crypto');
const { uploader, dbWriter, emailSender } = require('./index');

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

    const src = process.env.CDN_PATH + filename;
    const thumbnail = process.env.CDN_PATH + filename.replace('/full/', '/thumb/');

    addToDbWriterQueue(uploadResponse.data, metadata, resolution, userId);

    console.log(`✅ Status: ${uploadResponse.status} - ${filename} uploaded`);
    return {
      filename,
      src,
      thumbnail,
      metadata,
    };
  } catch (err) {
    console.log('err:', err);
  }
};

module.exports = async (req, res) => {
  const ws = req.app.locals.ws;
  uploader.process('imgUploader', async (job) => {
    // Get upload auth token
    const auth = await getB2UploadAuth(res);
    return upload(auth, job.data, ws);
  });

  uploader.on('completed', async (job, fileInfo) => {
    if (job.data.resolution === 'fullRes') {
      const emailSender = require('../tasks/emailSender');
      emailSender();
      try {
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
        console.log('ws error:', err);
      }
      // res.status(200).json(fileInfo).end();
    }
    job.remove();
  });
};
