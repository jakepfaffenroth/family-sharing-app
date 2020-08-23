const sharp = require('sharp');
const exif = require('exif-reader');

const premiumUser = false;

const { imgCompressor, uploader } = require('./index');

const compressImg = async (res, data) => {
  // const processedImgs = [];
  for (const image of data.images) {
    try {
      if (!(image.buffer instanceof Buffer)) {
        image.buffer = Buffer.from(image.buffer);
      }

      const imgFlow = sharp(image.buffer).rotate().withMetadata();

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

      const addToUploadQueue = (resolution, processedImg) => {
        uploader.add('imgUploader', {
          image: processedImg,
          resolution: resolution,
          guestId: data.guestId,
          userId: data.userId,
          fileCount: data.images.length,
          shareUrl: data.shareUrl,
        });
      };

      const compressGetMetaUpload = async (compress, resolution, image) => {
        const imageBuffer = compress;
        const metadata = await getMetadata(imageBuffer);
        addToUploadQueue(resolution, {
          ...image,
          size: imageBuffer.length,
          buffer: imageBuffer,
          w: metadata.w,
          h: metadata.h,
          exif: metadata.exif,
        });
        return imageBuffer;
      };

      // If premium user, send untouched image to upload queue. Otherwise, compress and resize the full image and then add to upload queue.
      let compFullBuffer;
      if (premiumUser) {
        compFullBuffer = await compressGetMetaUpload(image.buffer, 'fullRes', image);
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
      from ${getFileSize(image.buffer)} (orig)
        to ${getFileSize(compFullBuffer)} (full) ${premiumUser ? '(premium)' : ''}
        and ${getFileSize(compThumbBuffer)} (thumb)`);
      //
    } catch (err) {
      console.log('err:', err);
    }
  }
  return data.images;
};

module.exports = async (req, res) => {
  await imgCompressor.add('imgCompressor', {
    images: req.files,
    guestId: req.body.guestId,
    userId: req.body.userId,
    shareUrl: req.body.shareUrl,
  });
  try {
    imgCompressor.process('*', async (job) => {
      return compressImg(res, job.data);
    });
  } catch (err) {
    error(err);
  }
  // imgCompressor.whenCurrentJobsFinished().then(() => }
  //   return 'imgCompressor done'
  // //   console.log('~~~~ ALL DONE :) ~~~')
  // // });
  // // imgCompressor.on('completed', async (job, processedImgs) => {
  // //   // processedImgs.forEach((imageObj) => {
  // //   //   console.log('image from compressor result: ', imageObj);
  // //   // });
  // //   console.log('imgCompressor finished');
  // });
};
