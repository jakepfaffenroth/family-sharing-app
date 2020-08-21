const express = require('express');
const router = express.Router();

const notificationsController = require('./guestController');

router.get('/verify-email', notificationsController.verifyEmail);


module.exports = router;
