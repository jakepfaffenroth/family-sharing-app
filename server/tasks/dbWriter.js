const db = require('../db').pgPromise;

const writeToDb = async (data) => {
  let fileName = data.fileName;
  let uploadTime = Date.now();
  const imageInfo = {
    ownerId: data.ownerId,
    fileId: data.fileId,
    fileName: data.fileName,
    smallFileId: '',
    src: process.env.CDN_PATH + escape(fileName),
    thumbnail:
      process.env.CDN_PATH + escape(fileName.replace('/full/', '/thumb/')),
    w: data.metadata.w,
    h: data.metadata.h,
    exif: data.metadata.exif,
    uploadTime: uploadTime,
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
    // When a thumb res fileId is ready to added to the db, loop through until the full res record has been added; then update it with the thumbnail id.
    let fullResRecordExists = false;
    while (!fullResRecordExists) {
      fullResRecordExists = await updateRecordWithThumb();
      // If fullResRecordExists, break the loop
    }
  }

  return {
    fileId: imageInfo.fileId,
    smallFileId: imageInfo.smallFileId,
    fileName: imageInfo.fileName,
    exif: imageInfo.exif,
    uploadTime: imageInfo.uploadTime,
  };

  async function updateRecordWithThumb() {
    try {
      imageInfo.smallFileId = imageInfo.fileId;
      imageInfo.fileName = imageInfo.fileName.replace('/thumb/', '/full/');
      // Find the full size uploaded image. Gets most recent upload in case multiple with same filename exist.
      const fullResRecord = await db.oneOrNone(
        'UPDATE images SET small_file_id = ${fileId} WHERE image_id = (SELECT image_id FROM images WHERE file_name = ${fileName} AND owner_id = ${ownerId} ORDER BY image_id DESC LIMIT 1) RETURNING *',
        imageInfo
      );
      if (fullResRecord) {
      }
      return fullResRecord ? true : false;
    } catch (err) {
      error('Err updating image record with thumb info:', err);
      return;
    }
  }
};

module.exports = async (job) => {
  try {
    return await writeToDb(job.data);
  } catch (err) {
    error(err);
  }
};
