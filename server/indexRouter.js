const express = require('express');
// const session = require('express-session');
// const passport = require('passport');
const router = express.Router();
const ownerController = require('./users/ownerController');
const guestController = require('./users/guestController');
const notificationsController = require('./notifications/notificationsController');
// require('dotenv').config({ path: './bin/.env' });

const db = require('./db').pgPromise;

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', {
    title: 'Carousel',
    loginUrl: '/auth/login',
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

router.get('/login', async (req, res) => {
  // const customerId = req.query.id || null;

  // if (customerId) {
  //   const subscription = await stripe.subscriptions.list({
  //     customer: customerId,
  //   }).data[0];

  //   const plan = await stripe

  //   console.log('subscription:', subscription);
  //   await db.one('UPDATE owner SET subscription_id = ');
  // }

  const heading = req.query.emailconfirmed
    ? 'Email confirmed.<br>Sign in to your account.'
    : null;

  req.query.q ? (isErrVisible = true) : (isErrVisible = false);

  res.render('login', {
    loginUrl: '/auth/login',
    placeholderUsername: process.env.NODE_ENV === 'development' ? 'dev' : '',
    placeholderPassword: process.env.NODE_ENV === 'development' ? '123456' : '',
    errMsg: isErrVisible,
    heading,
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
