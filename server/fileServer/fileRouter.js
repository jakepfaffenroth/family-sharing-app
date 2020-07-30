const express = require('express');
const router = express.Router();
const multer = require('multer');

const fileController = require('./fileController');
const guestController = require('../users/guestController');

// File auth and CRUD
router.get('/b2-auth', fileController.b2Auth);

// Define multer storage
const storage = multer.memoryStorage();

router.post(
  '/upload',
  fileController.b2Auth,
  multer({ storage: storage }).any(),
  fileController.upload,
  guestController.emailNotification
);

router.post('/delete-image', fileController.b2Auth, fileController.deleteImage);

router.post('/list-files', fileController.b2Auth, fileController.listFiles);
router.post('/get-storage-size', fileController.b2Auth, fileController.getStorageSize);

router.get('/download', fileController.b2Auth, fileController.download);

module.exports = router;
