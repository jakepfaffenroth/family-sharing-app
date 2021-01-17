const express = require('express');
const router = express.Router();

const albumController = require('./albumController');

router.post(
  '/create-album',
  require('../users/demoController'),
  albumController.createAlbum
);
router.post(
  '/delete-album',
  require('../users/demoController'),
  albumController.deleteAlbum
);
router.post(
  '/add-image',
  require('../users/demoController'),
  albumController.addImage
);
router.post(
  '/remove-image',
  require('../users/demoController'),
  albumController.removeImage
);

module.exports = router;
