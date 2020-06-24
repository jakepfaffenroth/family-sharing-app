const express = require('express');
const router = express.Router();

// const axios = require('axios');
// const passport = require('passport');
// const LocalStrategy = require('passport-local');
// const bcrypt = require('bcryptjs');
// const User = require('../users/userModel');


const app = express();

console.log('in authRouter');

const loginController = require('./authController');



// Login, Logout routes
router.post('/login', loginController.login);

router.get('/logout', loginController.logout);

module.exports = router;
