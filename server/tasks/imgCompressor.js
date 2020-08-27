const fs = require('fs');
const sharp = require('sharp');
const exif = require('exif-reader');
const queues = require('./index');

const premiumUser = false;

const compressImg = async (data) => {
  // const processedImgs = [];
  for (const image of data.images) {
    try {
      // if (!(image.buffer instanceof Buffer)) {
      //   image.buffer = Buffer.from(image.buffer);
      // }
      const tempImg = fs.readFileSync(image.path);

      const imgFlow = sharp(tempImg).rotate().withMetadata();

      const compressFullImg = async () => {
        return await Promise.resolve(
          imgFlow
            .clone()
            .resize({
              width: 1200,
              height: 1200,
              fit: sharp.fit.inside,
              withoutEnlargement: true,
            })
            .jpeg({ quality: 80 })
            .toBuffer()
        );
      };

      const makeThumbnail = async () => {
        return await Promise.resolve(
          imgFlow
            .clone()
            .resize({
              width: 600,
              height: 600,
              fit: sharp.fit.inside,
              withoutEnlargement: true,
            })
            .jpeg({ quality: 80 })
            .toBuffer()
        );
      };

      const getMetadata = async (image) => {
        const output = sharp(image);
        return output.metadata().then(function (metadata) {
          const exifData = metadata.exif ? exif(metadata.exif) : null;
          return { w: metadata.width, h: metadata.height, exif: exifData };
        });
      };

      const addToUploadQueue = (resolutionStr, processedImg, data) => {
        const { guestId, userId, shareUrl, credentials, uppyFileId, fileCount } = data;
        queues.uploader.add({
          image: processedImg,
          resolution: resolutionStr,
          guestId,
          userId,
          fileCount,
          shareUrl,
          credentials,
          uppyFileId,
        });
      };

      const compressGetMetaUpload = async (compress, resolutionStr, image) => {
        const imageBuffer = compress;
        const metadata = await getMetadata(imageBuffer);

        // Compressed version is finished; Add to upload queue.
        addToUploadQueue(
          resolutionStr,
          {
            ...image,
            size: imageBuffer.length,
            buffer: imageBuffer,
            w: metadata.w,
            h: metadata.h,
            exif: metadata.exif,
          },
          data
        );
        return imageBuffer;
      };

      // If premium user, send untouched image to upload queue. Otherwise, compress and resize the full image and then add to upload queue.
      let compFullBuffer;
      if (premiumUser) {
        compFullBuffer = await compressGetMetaUpload(tempImg, 'fullRes', image);
      } else {
        compFullBuffer = await compressGetMetaUpload(await compressFullImg(), 'fullRes', image);
      }

      // Make thumbnail, get metadata, and send to upload queue
      const compThumbBuffer = await compressGetMetaUpload(await makeThumbnail(), 'thumbRes', image);

      const getFileSize = (buffer) => {
        return buffer.length / 1024 > 1024
          ? (buffer.length / 1024 / 1024).toFixed(2) + ' mb'
          : (buffer.length / 1024).toFixed(2) + ' kb';
      };

      const truncate = (str, truncLen, separator) => {
        if (str.length <= truncLen) return str;

        separator = separator || '...';

        const sepLen = separator.length,
          charsToShow = truncLen - sepLen,
          frontChars = Math.ceil(charsToShow / 2),
          backChars = Math.floor(charsToShow / 2);

        return str.substr(0, frontChars) + separator + str.substr(str.length - backChars);
      };

      success(`Compressed -- ${truncate(image.originalname, 30)}
      from ${getFileSize(tempImg)} (orig)
        to ${getFileSize(compFullBuffer)} (full) ${premiumUser ? '(premium)' : ''}
        and ${getFileSize(compThumbBuffer)} (thumb)`);
      //
    } catch (err) {
      error('err:', err);
    }
  }
  return;
};

const deleteTempImg = (image) => {
  fs.unlink(image.path, (err) => {
    if (err) {
      throw err;
    }
    success('Deleted ' + image.path);
  });
};

module.exports = async (job) => {
  try {
    await compressImg(job.data);
    deleteTempImg(job.data.images[0]);
    return;
  } catch (err) {
    error(err);
  }
};
