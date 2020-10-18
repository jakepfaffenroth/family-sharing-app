const express = require('express');
// const session = require('express-session');
// const passport = require('passport');
const router = express.Router();
const ownerController = require('./users/ownerController');
const guestController = require('./users/guestController');
const notificationsController = require('./notifications/notificationsController');
// require('dotenv').config({ path: './bin/.env' });

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', {
    title: 'Carousel',
    loginUrl: process.env.SERVER + '/auth/login',
  });
});

router.get('/signup', (req, res) => {
  res.render('signup');
});

router.get('/complete-signup', (req, res) => {
  res.render('accountCompletion');
});

router.get('/features', (req, res) => {
  res.render('features');
});

router.get('/pricing', (req, res) => {
  res.render('pricing');
});


router.get('/login', (req, res) => {
  req.query.q ? (isErrVisible = true) : (isErrVisible = false);
  res.render('login', {
    // layout: 'login',
    loginUrl: process.env.SERVER + '/auth/login',
    errMsg: isErrVisible,
  });
});

router.get('/:gId/guest', guestController.mark);
router.post(
  '/notifications/bounce',
  notificationsController.removeBouncedEmail
);
router.get('/user/get-owner', ownerController.getOwner);

router.get('/logout', (req, res) => {
  // req.session.destroy();
  req.logout();
  res.redirect('/login');
  verbose('Logged out');
});

module.exports = router;
