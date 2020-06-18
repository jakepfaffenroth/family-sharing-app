const express = require('express');
const router = express.Router();

const userController = require('../users/userController');

router.get('/users', userController.findUsers);

router.post('/create-user', userController.create);

module.exports = router;
