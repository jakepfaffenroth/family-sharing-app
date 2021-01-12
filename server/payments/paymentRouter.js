const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const paymentController = require('./paymentController');

// router.get('/config', async (req, res) => {
//   res.send({
//     publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
//   });
// });
// router.get('/checkout', (req, res) => {
//   res.render('payment', { planSelected: req.body.planSelected });
// });

router.post('/save-basic', paymentController.saveBasic);

router.post('/charge', (req, res) => {
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

// router.post('/create-customer', paymentController.createCustomer);

router.post(
  '/create-checkout-session',
  paymentController.createCheckoutSession
);

router.get('/finalize-checkout', paymentController.finalizeCheckout);

// router.post('/retry-invoice', paymentController.retryInvoice);

// router.post('/retrieve-upcoming-invoice', paymentController.upcomingInvoice);

// router.post('/cancel-subscription', paymentController.cancelSubscription);

router.post('/update-subscription', paymentController.updateSubscription);

router.post(
  '/retrieve-payment-method',
  paymentController.retrievePaymentMethod
);

// Webhook handler for asynchronous events.
router.post(
  '/stripe-webhook',
  paymentController.stripeWebhook
);

module.exports = router;
