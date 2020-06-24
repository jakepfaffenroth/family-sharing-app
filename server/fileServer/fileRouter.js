const express = require('express');
const router = express.Router();
const multer = require('multer');


const fileController = require('./fileController');

// File auth and CRUD
router.get('/b2/auth', fileController.b2Auth);

// Define multer storage and file naming
const tempStorage = multer.diskStorage({
  destination: './temp/uploads',
  filename: function(req, file, cb) {
    cb(null, file.originalname);
  },
});

router.post(
  '/b2/upload',
  fileController.b2Auth,
  multer({ storage: tempStorage }).array('myFiles'),
  fileController.upload
);

router.post('/b2/list-files', fileController.b2Auth, fileController.listFiles);

router.get('/b2/download', fileController.b2Auth, fileController.download);

module.exports = router;
