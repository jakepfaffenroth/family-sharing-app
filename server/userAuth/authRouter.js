const express = require('express');
const router = express.Router();

const authController = require('./authController');

// Login, Logout routes
router.post('/login', authController.login);

router.get('/logout', authController.logout);

router.post('/check-session', authController.checkSession)

module.exports = router;