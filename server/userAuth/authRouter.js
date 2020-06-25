const express = require('express');
const router = express.Router();

const loginController = require('./authController');

// Login, Logout routes
router.post('/login', loginController.login);

router.get('/logout', loginController.logout);

module.exports = router;
