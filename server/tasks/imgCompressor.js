const sharp = require('sharp');
const exif = require('exif-reader');

const premiumUser = false;

const { imgCompressor, uploader } = require('./index');

const compressImg = async (res, data) => {
  // const processedImgs = [];
  for (const image of data.images) {
    try {
      if (!(image.buffer instanceof Buffer)) {
        console.log('converting to buffer...');
        image.buffer = Buffer.from(image.buffer);
      }

      console.log('buffer.length: ', (image.buffer.length / 1024).toFixed(2), 'kb');

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
          const exifData = exif(metadata.exif);
          return { w: metadata.width, h: metadata.height, exif: exifData };
        });
      };

      const addToUploadQueue = (resolution, processedImg) => {
        console.log('buffer.length: ', (processedImg.buffer.length / 1024).toFixed(2), 'kb');
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
      };

      // If premium user, send untouched image to upload queue. Otherwise, compress and resize the full image and then add to upload queue.
      if (premiumUser) {
        compressGetMetaUpload(null, 'fullRes', image);
      } else {
        compressGetMetaUpload(await compressFullImg(), 'fullRes', image);
      }

      // Make thumbnail, get metadata, and send to upload queue
      compressGetMetaUpload(await makeThumbnail(), 'thumbRes', image);
    } catch (err) {
      console.log('err:', err);
    }
  }
  return;
};

module.exports = async (req, res) => {
  await imgCompressor.add('imgCompressor', {
    images: req.files,
    guestId: req.body.guestId,
    userId: req.body.userId,
    shareUrl: req.body.shareUrl,
  });

  imgCompressor.process('imgCompressor', async (job) => {
    return compressImg(res, job.data);
  });

  imgCompressor.on('completed', async (job, processedImgs) => {
    // processedImgs.forEach((imageObj) => {
    //   console.log('image from compressor result: ', imageObj);
    // });
    console.log('imgCompressor finished');
  });
};
