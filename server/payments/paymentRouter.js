const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const paymentController = require('./paymentController');

router.get('/test-create-customer', (req, res) => {
  res.render('payment');
});

router.get('/config', async (req, res) => {
  res.send({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
});
router.get('/checkout', (req, res) => {
  res.render('payment', { planSelected: req.body.planSelected });
});

router.post('/save-basic', paymentController.savePlanToDb);

router.post('/charge', (req, res) => {
  console.log('req.body:', req.body);
  try {
    stripe.customers
      .create({
        name: req.body.name,
        email: req.body.email,
        source: req.body.stripeToken,
      })
      .then((customer) =>
        stripe.charges.create({
          amount: req.body.amount * 100,
          currency: 'usd',
          customer: customer.id,
        })
      )
      .then(() => res.json({ paymentCompleted: true }))
      .catch((err) => error(new Error(err)));
  } catch (err) {
    error(new Error(err));
    res.send(err);
  }
});

router.post('/create-customer', paymentController.createCustomer);

router.post('/create-subscription', paymentController.createSubscription);

router.post('/retry-invoice', paymentController.retryInvoice);

router.post('/retrieve-upcoming-invoice', paymentController.upcomingInvoice);

router.post('/cancel-subscription', paymentController.cancelSubscription);

router.post('/update-subscription', paymentController.updateSubscription);

router.post(
  '/retrieve-payment-method',
  paymentController.paymentMethod
);

// Webhook handler for asynchronous events.
router.post(
  '/stripe-webhook',
  bodyParser.raw({ type: 'application/json' }),
  paymentController.stripeWebhook
);

module.exports = router;
