const express = require('express');
const router = express.Router();

const userController = require('./userController');

router.post('/create-user', userController.create);

// GET list of all users
router.post('/get-user', userController.getUser);


module.exports = router;
