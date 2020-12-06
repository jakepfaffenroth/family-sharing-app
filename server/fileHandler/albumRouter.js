const express = require('express');
const router = express.Router();

const albumController = require('./albumController');

router.post('/create-album', albumController.createAlbum);
router.post('/delete-album', albumController.deleteAlbum);
router.post('/add-image', albumController.addImage);
router.post('/remove-image', albumController.removeImage);

module.exports = router;
