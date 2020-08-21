const express = require('express');
const router = express.Router();

const emailController = require('./emailController');
const browserController = require('./browserController');

router.post('/subscribe-email', emailController.sendSubscribeEmail);
router.post('/subscribe-browser', browserController.subscribeBrowser);

module.exports = router;
