const { verbose } = require('../config/winston');
const pgpHelpers = require('../db').pgpHelpers;
const db = require('../db').pgPromise;

module.exports.createAlbum = async (req, res) => {
  const newAlbum = await db.oneOrNone(
    'INSERT INTO albums VALUES (DEFAULT, ${name}, ${ownerId}) RETURNING *',
    req.body
  );
  if (newAlbum) verbose('Album created');
  res.json(newAlbum);
};

module.exports.deleteAlbum = async (req, res) => {
  const removedAlbum = await db.one(
    'DELETE FROM albums WHERE album_id = ${albumId} RETURNING *',
    req.body
  );
  verbose('Album deleted');
  res.json(removedAlbum);
};

module.exports.addImage = async (req, res) => {
  const columnSet = new pgpHelpers.ColumnSet(
    ['album_id', 'file_id', 'owner_id'],
    { table: 'album_images' }
  );
  const newPairs = req.body.imgsToAdd;

  try {
    const onConflict =
      ' ON CONFLICT ON CONSTRAINT album_images_pkey DO NOTHING RETURNING *';

    const insertQuery =
      newPairs.length === 0
        ? ''
        : pgpHelpers.insert(newPairs, columnSet) + onConflict;

    const selectQuery = `SELECT images.*, album_images.album_id FROM images LEFT JOIN album_images ON images.file_id = album_images.file_id WHERE images.owner_id = '${req.body.ownerId}'`;

    const query = pgpHelpers.concat([insertQuery, selectQuery]);

    const addedImages = await db.any(query);

    res.json(addedImages);
  } catch (err) {
    console.error(err);
  }
};

module.exports.removeImage = async (req, res) => {
  const imgsToRemove = req.body.imgsToRemove;

  const deleteQuery =
    pgpHelpers.concat(
      imgsToRemove.map((pair) => ({
        query:
          'DELETE FROM album_images WHERE file_id = ${file_id} AND album_id = ${album_id} AND owner_id = ${owner_id}',
        values: pair,
      }))
    ) || '';

  const selectQuery = `SELECT images.*, album_images.album_id FROM images LEFT JOIN album_images ON images.file_id = album_images.file_id WHERE images.owner_id = '${req.body.ownerId}'`;

  const query = pgpHelpers.concat([deleteQuery, selectQuery]);
  const updatedImages = await db.any(query);
  verbose('Image removed from album');
  res.json(updatedImages);
};
