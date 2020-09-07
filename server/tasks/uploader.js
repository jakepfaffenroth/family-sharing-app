const path = require('path');
const axios = require('axios');
const crypto = require('crypto');
const { uploader, dbWriter } = require('./index');

const bucketId = process.env.BUCKET_ID;

const getB2UploadAuth = async (credentials) => {
  try {
    return await axios.post(
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
  } catch (err) {
    console.log('Error getting B2 upload token');
  }
};

const addToDbWriterQueue = (data, metadata, resolution, ownerId) => {
  dbWriter.add({
    fileId: data.fileId,
    fileName: data.fileName,
    metadata,
    resolution: resolution,
    ownerId: ownerId,
  });
};

const upload = async (auth, data) => {
  const { ownerId, image, resolution } = data;
  const metadata = {
    w: image.w,
    h: image.h,
    exif: image.exif,
  };

  try {
    // Uploads images to B2 storage
    let source = Buffer.from(image.buffer);
    let fileSize = image.size;
    let filename = `${ownerId}/${resolution.replace('Res', '')}/${path.basename(image.name)}`;
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
      await getB2UploadAuth(data.credentials);
      uploader.resume();
    }

    const src = process.env.CDN_PATH + filename;
    const thumbnail = process.env.CDN_PATH + filename.replace('/full/', '/thumb/');

    // File upload to B2 complete; Send to dbWriter queue.
    addToDbWriterQueue(uploadResponse.data, metadata, resolution, ownerId);

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
      resolution,
      fileId: uploadResponse.data.fileId,
      uploadTime: uploadResponse.data.uploadTimestamp,
      status: uploadResponse.status,
    };
  } catch (err) {
    error('err:', err);
  }
};

module.exports = async (job) => {
  try {
    let uploadUrl = await getB2UploadAuth(job.data.credentials);
    if (!uploadUrl || uploadUrl.status === '401') {
      const getNew = true;
      const newCreds = await require('../tasks/getB2Auth')(getNew);
      uploadUrl = await getB2UploadAuth(newCreds);
    }

    const uploadAuth = {
      uploadAuthorizationToken: uploadUrl.data.authorizationToken,
      uploadUrl: uploadUrl.data.uploadUrl,
    };
    const result = await upload(uploadAuth, job.data);
    const ws = require('../app').locals.ws;
    if (result.resolution === 'thumbRes') {
      ws.send(
        Buffer.from(
          JSON.stringify({
            type: 'fileUploaded',
            fileInfo: { ...result, src: result.src.replace('/thumb/', '/full/') },
          })
        )
      );
    }
    return result;
  } catch (err) {
    error(err);
  }
};
