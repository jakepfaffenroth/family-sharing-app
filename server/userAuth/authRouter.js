const express = require('express');
const router = express.Router();

const authController = require('./authController');

// Login, Logout routes
router.post('/login', authController.login);

router.get('/logout', authController.logout);

router.post('/check-session', authController.checkSession);

router.post('/reset-password', authController.requestPasswordReset);

router.get('/password-reset-form/:owner', authController.passwordResetForm);

router.post('/submit-password-reset/:owner', authController.submitPasswordReset);

module.exports = router;
