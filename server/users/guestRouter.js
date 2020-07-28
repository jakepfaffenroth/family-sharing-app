const express = require('express');
const router = express.Router();

const guestController = require('./guestController');

router.post('/subscribe-email', guestController.subscribeEmail);
router.post('/subscribe-browser', guestController.subscribeBrowser);
router.get('/verify', guestController.verify);


module.exports = router;
