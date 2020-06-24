const express = require('express');
const session = require('express-session');
const passport = require('passport');
const router = express.Router();
require('dotenv').config();

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', { title: 'Family Sharing App' });
});

router.get('/login', (req, res, next) => {
  console.log('in login');
  res.render('login', { loginUrl: process.env.SERVER + '/auth/login', incorrectCred: res.locals.incorrectCred });
});

router.get('/logout', (req, res) => {
  // req.session.destroy();
  req.logout();
  res.redirect('/login');
  console.log('Logged out');
});

module.exports = router;
