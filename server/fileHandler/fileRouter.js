const express = require('express');
const router = express.Router();

const fileController = require('./fileController');
const notificationsController = require('../notifications/notificationsController');
const getB2Auth = require('../tasks/getB2Auth');

router.get('/b2-auth', fileController.b2Auth);

router.post('/initialize-upload', notificationsController.addToNotifsQueue);

router.post(
  '/upload',
  async (req, res, next) => {
    // Tracks filecount in this upload batch
    // Counter is updated as files finish (in db/index)
    // When counter reaches zero, the batch is complete - send msg to client so usage data can be fetched and updated.
    const app = require('../app');
    app.locals.uploadCounter = app.locals.uploadCounter || 0;
    app.locals.uploadCounter += 2;

    res.locals.credentials = await getB2Auth(false);
    next();
  },
  fileController.imgCompressor
);

router.post('/delete-image', fileController.b2Auth, fileController.deleteImage);

router.post('/list-files', fileController.b2Auth, fileController.listFiles);
router.post('/get-usage', fileController.b2Auth, fileController.getUsage);

router.post('/add-to-albums', fileController.addToAlbums);
router.post('/fetch-images', fileController.fetchImages);

router.get('/download', fileController.b2Auth, fileController.download);

module.exports = router;
