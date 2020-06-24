const express = require('express');
const router = express.Router();

const userController = require('./userController');

router.post('/create-user', userController.create);

// GET list of all users
router.get('/users', userController.findUsers);


module.exports = router;
