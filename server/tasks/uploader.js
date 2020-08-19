const path = require('path');
const axios = require('axios');
const crypto = require('crypto');
const { uploader, dbWriter } = require('./index');

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
  const resolution = data.resolution;
  const image = data.image;
  const metadata = {
    w: data.image.w,
    h: data.image.h,
    exif: data.image.exif,
  };

  try {
    // Uploads images to B2 storage
    let source = Buffer.from(image.buffer);
    let fileSize = image.size;
    let fileName = `${userId}/${resolution.replace('Res', '')}/${path.basename(image.originalname)}`;
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

    // ws.send(uploadResponse.data.toString());
    addToDbWriterQueue(uploadResponse.data, metadata, resolution, userId);

    console.log(`✅ Status: ${uploadResponse.status} - ${uploadResponse.data.fileName} uploaded`);
    return uploadResponse.data;
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

  uploader.on('completed', async (job, result) => {
    console.log('result: ', result);
    if (job.data.resolution === 'fullRes') {
      res.status(200).json(result.fileName).end();
    }
  });
};
