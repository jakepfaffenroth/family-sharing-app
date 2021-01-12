const express = require('express');
const router = express.Router();

const ownerController = require('./ownerController');
const guestController = require('./guestController');
const emailController = require('./emailController');

// Owner routers
router.post('/create-owner', ownerController.create);
router.post('/get-owner', ownerController.getOwner);
router.post('/delete-account', ownerController.DELETE_ACCOUNT);
router.post('/resend-owner-verification', async (req, res) => {
  emailController.sendOwnerConfirmationEmail({ owner: req.body.owner, res });
});

// Guest routers
router.post('/subscribe-email', guestController.subscribeEmail);
router.post('/subscribe-browser', guestController.subscribeBrowser);
router.get('/verify-email', (req, res) => {
  if (req.query.owner) {
    emailController.confirmOwnerEmail(req, res);
  } else if (req.query.guest) {
    emailController.verifyGuestEmail(req, res);
  } else {
    res.status(404);
  }
});
router.post('/get-subscribers', guestController.getSubscribers);

module.exports = router;
