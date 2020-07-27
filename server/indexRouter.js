const express = require('express');
// const session = require('express-session');
// const passport = require('passport');
const router = express.Router();
const userController = require('./users/userController');
const guestController = require('./users/guestController');
require('dotenv').config();

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', { title: 'Family Sharing App' });
});

router.get('/signup', (req, res) => {
  res.render('signup');
});

router.get('/login', (req, res) => {
  req.query.q ? isErrVisible = true : isErrVisible = false
  res.render('login', { loginUrl: process.env.SERVER + '/auth/login', errMsg: isErrVisible });
});

router.get('/:gId/guest', guestController.mark)
router.post('/guest/subscribe', guestController.subscribe)

router.get('/user/get-user', userController.getUser)

router.get('/logout', (req, res) => {
  // req.session.destroy();
  req.logout();
  res.redirect('/login');
  console.log('Logged out');
});

module.exports = router;
