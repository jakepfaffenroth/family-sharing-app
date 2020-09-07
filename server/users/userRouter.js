const express = require('express');
const router = express.Router();

const ownerController = require('./ownerController');
const guestController = require('./guestController');

// Owner routers
router.post('/create-owner', ownerController.create);
router.post('/get-owner', ownerController.getOwner);

// Guest routers
router.post('/subscribe-email', guestController.subscribeEmail);
router.post('/subscribe-browser', guestController.subscribeBrowser);
router.get('/verify-email', guestController.verifyEmail);


module.exports = router;
