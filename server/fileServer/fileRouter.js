const express = require('express');
const router = express.Router();
const multer = require('multer');

const fileController = require('./fileController');
const notificationsController = require('../notifications/notificationsController');
const getB2Auth = require('../tasks/getB2Auth');

router.get('/b2-auth', fileController.b2Auth);

// Define multer storage
const memStorage = multer.memoryStorage();
const diskStorage = multer.diskStorage({
  destination: '/tmp/uploads',
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

router.post(
  '/upload',
  notificationsController.addToNotifsQueue,
  async (req, res, next) => {
    res.locals.credentials = await getB2Auth();
    next();
  },
  multer({ storage: diskStorage }).any(),
  fileController.imgHandler
);

router.post('/delete-image', fileController.b2Auth, fileController.deleteImage);

router.post('/list-files', fileController.b2Auth, fileController.listFiles);
router.post('/get-storage-size', fileController.b2Auth, fileController.getStorageSize);

router.get('/download', fileController.b2Auth, fileController.download);

module.exports = router;
