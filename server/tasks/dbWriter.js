const db = require('../db').pgPromise;

const writeToDb = async (data) => {
  let fileName = data.fileName;
  let uploadTime = Date.now();
  const imageInfo = {
    ownerId: data.ownerId,
    fileId: data.fileId,
    fileName: data.fileName,
    thumbFileId: '',
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
    // const foundImage = await db.one(
    //   'SELECT * FROM images WHERE file_id = ${fileId}',
    //   imageInfo
    // );
    // When a thumb res fileId is ready to added to the db, loop through until the full res record has been added; then update it with the thumbnail id.
    let fullResRecordExists = await updateRecordWithThumb();
    // console.log('fullResRecordExists:', fullResRecordExists);
    if (!fullResRecordExists) {
      const loop = setInterval(async () => {
        // console.log(`Looping ${imageInfo.fileName}...`);
        fullResRecordExists = await updateRecordWithThumb();
        // console.log('fullResRecordExists:', fullResRecordExists);
        if (fullResRecordExists) {
          clearInterval(loop);
          // success(`Broke   ${imageInfo.fileName}`);
        }
      }, 3000);
    }
    // while (!fullResRecordExists) {
    //   console.log(`Looping ${imageInfo.fileName}...`);
    //   // If fullResRecordExists, break the loop
    //   fullResRecordExists = await updateRecordWithThumb();
    //   console.log('fullResRecordExists:', fullResRecordExists);
    //   if (fullResRecordExists) {
    //     success(`Broke   ${imageInfo.fileName}`);
    //   }
    // }
  }

  return {
    fileId: imageInfo.fileId,
    thumbFileId: imageInfo.thumbFileId,
    fileName: imageInfo.fileName,
    exif: imageInfo.exif,
    uploadTime: imageInfo.uploadTime,
  };

  async function updateRecordWithThumb() {
    try {
      imageInfo.thumbFileId = imageInfo.fileId;
      imageInfo.fileName = imageInfo.fileName.replace('/thumb/', '/full/');
      // Find the full size uploaded image. Gets most recent upload in case multiple with same filename exist.
      const updatedRecord = await db.oneOrNone(
        'UPDATE images SET thumb_file_id = ${fileId} WHERE file_id = (SELECT file_id FROM images WHERE file_name = ${fileName} AND owner_id = ${ownerId} ORDER BY file_id DESC LIMIT 1) RETURNING *',
        imageInfo
      );
      // console.log(
      //   'updatedRecord ?',
      //   updatedRecord ? true : false
      // );
      if (updatedRecord) {
        // DB record is compelete
        // Send the file info back to client to update images state
        const ws = require('../app').locals.ws;
        ws.send(
          Buffer.from(
            JSON.stringify({
              type: 'fileUploaded',
              fileInfo: updatedRecord,
            })
          )
        );
      }
      return updatedRecord ? true : false;
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
