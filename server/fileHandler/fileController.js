const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { Readable, pipeline } = require('stream');
const pgpHelpers = require('../db').pgpHelpers;
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
      'https://api.backblazeb2.com/b2api/v2/b2_authorize_account',
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
    .catch((err) => {
      error('err: ', err.response.data); // an error occurred
    });
};

module.exports.listFiles = async (req, res) => {
  const apiUrl = res.locals.credentials.apiUrl;
  const authToken = res.locals.credentials.authorizationToken;
  const filePrefix = req.body.ownerId;
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
  } catch (err) {
    error('listFiles error: \n%0', err.response);
  }
};

module.exports.deleteImage = async (req, res, next) => {
  const images =
    req.body.images ||
    (await module.exports.listFiles(req, res)).map((x) => ({
      ...x,
      ownerId: req.body.ownerId,
    }));

  const credentials = res.locals.credentials;

  try {
    const dbDeleteResult = deleteFromDb(images);
    const fullResDeleteResult = deleteFullResFromB2(images);
    const thumbResDeleteResult = deleteThumbnailfromB2(images);

    const results = await Promise.all([
      dbDeleteResult,
      fullResDeleteResult,
      thumbResDeleteResult,
    ]);

    if (!results[0]) {
      throw new Error('Could not find full res file in DB.');
    } else {
      const updatedImages = await db.any(
        'SELECT images.*, album_images.album_id FROM images LEFT JOIN album_images ON images.file_id=album_images.file_id WHERE images.owner_id=${ownerId} ORDER BY upload_time ASC',
        req.body
      );

      if (req.body.images) {
        success('File was deleted from B2');
        success('File was removed from db');
      } else {
        success('File was NUKED from B2 and db');
      }

      res.status(200).json(updatedImages);
    }
  } catch (err) {
    console.error('err:', err);
    res.status(500).json(err);
  }

  // NUKE images totally from B2 and DB
  // if (NUKE) {
  //   const files = (await module.exports.listFiles(req, res)).map((x) => ({
  //     ...x,
  //     ownerId: x.fileName.split('/')[0],
  //   }));

  //   try {
  //     deleteFromDb(files);
  //     files.forEach(async (image) => {
  //       const dbDeleteResult = await db.oneOrNone(
  //         'DELETE FROM images WHERE owner_id = ${ownerId} AND file_id = ${fileId} RETURNING *',
  //         { ...image, ownerId: image.fileName.split('/')[0] }
  //       );

  //       // Delete full res image file from B2
  //       const fileDeleteResult = await axios.post(
  //         credentials.apiUrl + '/b2api/v1/b2_delete_file_version',
  //         {
  //           fileName: unescape(image.fileName),
  //           fileId: image.fileId,
  //         },
  //         { headers: { Authorization: credentials.authorizationToken } }
  //       );
  //       if (dbDeleteResult && fileDeleteResult) {
  //         success('File was NUKED from B2 and db');
  //       }
  //     });
  //     res.status(200).send('ok');
  //   } catch (err) {
  //     error('Nuke error:\n%0', err);
  //     res.status(500).json(deletionStatus.err);
  //   }
  // }

  async function deleteFromDb(images) {
    const deletionQuery = pgpHelpers.concat(
      images.map((image) => ({
        query:
          'DELETE FROM images WHERE owner_id = ${ownerId} AND file_id = ${fileId} RETURNING *',
        values: image,
      }))
    );
    try {
      return db.any(deletionQuery);
    } catch (err) {
      console.error(err);
    }
  }

  async function deleteThumbnailfromB2(images) {
    const deletionResult = [];
    images.forEach((image) => {
      deletionResult.push(
        axios.post(
          credentials.apiUrl + '/b2api/v1/b2_delete_file_version',
          {
            fileName: unescape(image.fileName).replace('/full/', '/thumb/'),
            fileId: image.thumbFileId,
          },
          { headers: { Authorization: credentials.authorizationToken } }
        )
      );
    });
    return deletionResult;
  }

  async function deleteFullResFromB2(images) {
    const deletionResult = [];
    images.forEach((image) => {
      deletionResult.push(
        axios.post(
          credentials.apiUrl + '/b2api/v1/b2_delete_file_version',
          {
            fileName: unescape(image.fileName),
            fileId: image.fileId,
          },
          { headers: { Authorization: credentials.authorizationToken } }
        )
      );
      return deletionResult;
    });
  }
};

// UNUSED - calculating on client instead
// module.exports.getUsage = async (req, res) => {
//   const files = await this.listFiles(req, res);
//   let totalStorageUsed = files.reduce(
//     (accumulator, currentValue) => accumulator + currentValue.contentLength,
//     0
//   );

//   let kilobytes = parseFloat((totalStorageUsed / 1024).toFixed(2));
//   let megabytes = parseFloat((kilobytes / 1024).toFixed(2));
//   let gigabytes = parseFloat((megabytes / 1024).toFixed(2));

//   res.json({
//     kb: kilobytes,
//     mb: megabytes,
//     gb: gigabytes,
//   });
// };

module.exports.addToAlbums = async (req, res) => {
  const newPairs = req.body.imgAlbumPairs;
  console.log('newPairs:', newPairs);
  const fileIds = [...new Set(newPairs.map((x) => x.fileId))];

  const columnSet = new pgpHelpers.ColumnSet(
    ['album_id', 'file_id', 'owner_id'],
    { table: 'album_images' }
  );

  try {
    const updatedImages = await db.task(async (t) => {
      const getExistingPairsQuery = pgpHelpers.concat(
        fileIds.map((fileId) => ({
          query:
            'SELECT * FROM album_images WHERE owner_id = ${ownerId} AND file_id = ${fileId}',
          values: { ownerId: req.body.ownerId, fileId },
        }))
      );

      const [existingPairs] = getExistingPairsQuery.length
        ? await db.multi(getExistingPairsQuery)
        : null;

      const pairsToRemove = existingPairs.filter(
        (x) =>
          newPairs.findIndex(
            (k) => k.albumId === x.albumId && k.fileId === x.fileId
          ) === -1
      );
      console.log('pairsToRemove:', pairsToRemove);
      const pairsToAdd = newPairs
        .filter((x) => {
          x.albumId &&
            existingPairs.findIndex((k) => {
              return k.albumId === x.albumId && k.fileId === x.fileId;
            }) === -1;
        })
        .map((x) => ({
          album_id: x.albumId,
          file_id: x.fileId,
          owner_id: req.body.ownerId,
        }));
      console.log('pairsToAdd:', pairsToAdd);
      const removePairsQuery =
        pgpHelpers.concat(
          pairsToRemove.map((pair) => ({
            query:
              'DELETE FROM album_images WHERE file_id = ${fileId} AND album_id = ${albumId}',
            values: pair,
          }))
        ) || '';

      const insertPairsQuery =
        pairsToAdd.length === 0 ? '' : pgpHelpers.insert(pairsToAdd, columnSet);

      // console.log('insertPairsQuery:', insertPairsQuery);

      const addAndRemoveQuery = pgpHelpers.concat([
        removePairsQuery,
        insertPairsQuery,
      ]);
      // console.log('addAndRemoveQuery:', addAndRemoveQuery);
      await t.none(addAndRemoveQuery);

      return await t.any(
        'SELECT images.*, album_images.album_id FROM images LEFT JOIN album_images ON images.file_id = album_images.file_id WHERE images.owner_id = ${ownerId}',
        req.body
      );
    });
    res.json(updatedImages);
  } catch (err) {
    console.error(err);
  }
};

module.exports.fetchImages = async (req, res) => {
  const images = await db.any(
    'SELECT images.*, album_images.album_id FROM images LEFT JOIN album_images ON images.file_id=album_images.file_id WHERE images.owner_id=${ownerId} OR images.owner_id=(SELECT owner_id FROM owners WHERE guest_id = ${guestId}) ORDER BY upload_time ASC',
    req.body
  );
  res.json(images);
};

// Logic for handling incoming file and compressing
module.exports.imgCompressor = async (req, res, next) => {
  const { plan } = await db.one(
    'SELECT plan FROM owners WHERE owner_id = ${id}',
    req.headers
  );
  plan === null ? console.log('no owner found...') : null;

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
    info('[' + filename + '] Started');

    fields.filename = filename;
    const chunks = [];

    // If premium user, fullRes image chunks are streamed straight into an array
    if (plan.includes('premium')) {
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
      if (plan.includes('premium')) {
        const fullResBuffer = Buffer.concat(chunks);
        const { format, size, width, height, exif } = await getMetadata(
          fullResBuffer
        );
        const info = { format, size, width, height, exif };
        receiveCompImgs(fullResBuffer, 'fullRes', info);
      }
      info('[' + filename + '] Finished');
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
  if (plan === 'basic') {
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
      plan === /premium/ ? '(premium)' : ''
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
