const { expect } = require('chai');
const fileController = require('../../fileHandler/fileController');
let db = require('../../db').pgPromise;
// import fileController from '/fileHandler/fileController.js';

describe('albums', () => {
  // const addImgAlbumPairUrl = process.env.SERVER + 'albums/add-to-albums';
  beforeEach(async () => {
    db.none('TRUNCATE album_images RESTART IDENTITY');
  });

  test('new imgs added to album updates db', async () => {
    const ownerId = 'mockOwnerId';
    const imgAlbumPairs = [{ fileId: 'mockFileId', albumId: 1 }];

    const req = {
      body: {
        ownerId,
        imgAlbumPairs,
      },
    };
    const res = {};

    const updatedImgAlbumPairs = await fileController.addToAlbums(req, res);

    imgAlbumPairs.forEach(async (pair) => {
      const result = await db.oneOrNone(
        'SELECT * FROM album_images WHERE album_id = ${albumId} AND file_id = ${fileId}',
        pair
      );
      expect(result).to.be.ok;
      expect(result.albumId).to.equal(pair.albumId);
    });
  });

  test('removing img from album updates db', async () => {
    const imgToRemove = {
      albumId: 1,
      fileId: 'mockFileId',
      ownerId: 'mockOwnerId',
    };

    await db.one(
      'DELETE FROM album_images WHERE album_id = ${albumId}',
      imgToRemove
    );
    const result = await db.one(
      'SELECT * FROM album_images WHERE album_id = ${albumId}',
      imgToRemove
    );

    expect(result).to.be.not.ok;
    expect(result.albumId).to.equal(imgToRemove.albumId);
  });
});
