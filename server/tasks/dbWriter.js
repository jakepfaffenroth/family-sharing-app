const db = require('../db').pgPromise;
const { dbWriter } = require('./index');

const writeToDb = async (data) => {
  let fileName = data.fileName;
  let uploadTime = Date.now();

  const imageInfo = {
    ownerId: data.ownerId,
    fileId: data.fileId,
    fileName: data.fileName,
    smallFileId: '',
    src: process.env.CDN_PATH + fileName,
    thumbnail: process.env.CDN_PATH + fileName.replace('/full/', '/thumb/'),
    w: data.metadata.w,
    h: data.metadata.h,
    exif: data.metadata.exif,
    uploadTime: uploadTime,
  };

  const updateRecordWithThumb = async () => {
    try {
      imageInfo.smallFileId = imageInfo.fileId;
      imageInfo.fileName = imageInfo.fileName.replace('/thumb/', '/full/');
      // Find the full size uploaded image. Gets most recent upload in case multiple with same filename exist.
      const foundRecord = await db.oneOrNone(
        'UPDATE images SET small_file_id = ${fileId} WHERE image_id = (SELECT image_id FROM images WHERE file_name = ${fileName} AND owner_id = ${ownerId} ORDER BY image_id DESC LIMIT 1) RETURNING *',
        imageInfo
      );
      return foundRecord;
    } catch (err) {
      error('Err updating image record with thumb info:', err);
      return;
    }
  };

  if (data.resolution === 'fullRes') {
    try {
      const image = await db.one(
        'INSERT INTO images (file_id, file_name, src, thumbnail, w, h, exif, upload_time, owner_id) VALUES (${fileId}, ${fileName}, ${src}, ${thumbnail}, ${w}, ${h}, ${exif}, ${uploadTime}, ${ownerId}) RETURNING *',
        imageInfo
      );
    } catch (err) {
      error('Error adding image to db', err);
      return;
    }
  } else if (data.resolution === 'thumbRes') {
    let foundRecord = null;
    while (!foundRecord) {
      foundRecord = await updateRecordWithThumb();
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

module.exports = async (job) => {
  try {
    return await writeToDb(job.data);
  } catch (err) {
    error(err);
  }
};
