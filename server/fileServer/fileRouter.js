const express = require('express');
const router = express.Router();
const multer = require('multer');

const fileController = require('./fileController');

// File auth and CRUD
router.get('/b2-auth', fileController.b2Auth);

// Define multer storage and file naming
const tempStorage = multer.diskStorage({
  destination: '../temp/uploads',
  filename: function(req, file, cb) {
    cb(null, file.originalname);
  },
});

router.post(
  '/upload',
  fileController.b2Auth,
  multer({ storage: tempStorage }).any(),
  fileController.upload
);

router.post('/delete-image', fileController.b2Auth, fileController.deleteImage)

router.post('/list-files', fileController.b2Auth, fileController.listFiles);

router.get('/download', fileController.b2Auth, fileController.download);

module.exports = router;
