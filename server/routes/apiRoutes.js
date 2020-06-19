const express = require('express');
const router = express.Router();

const userController = require('../users/userController');
const fileController = require('../b2/fileController');


router.post('/create-user', userController.create);
// router.get('/login', userController.login)

// GET list of all users
router.get('/users', userController.findUsers);

// File auth and CRUD
router.get('/b2/auth', fileController.auth);
router.post('/b2/upload', fileController.auth, fileController.upload);
router.get('/b2/download', fileController.auth, fileController.download);

module.exports = router;
