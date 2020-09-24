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
    res.locals.credentials = await getB2Auth(false);
    next();
  },
  fileController.imgCompressor
);

router.post('/delete-image', fileController.b2Auth, fileController.deleteImage);

router.post('/list-files', fileController.b2Auth, fileController.listFiles);
router.post(
  '/get-storage-size',
  fileController.b2Auth,
  fileController.getStorageSize
);

router.get('/download', fileController.b2Auth, fileController.download);

module.exports = router;
