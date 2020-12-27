// const express = require('express');
// const app = express();
// const { resolve } = require('path');
// const bodyParser = require('body-parser');
// Replace if using a different env file or config
// require('dotenv').config();
const db = require('../db').pgPromise;
const { debug, info } = require('winston');

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

if (
  !process.env.STRIPE_SECRET_KEY ||
  !process.env.STRIPE_PUBLISHABLE_KEY ||
  !process.env.PREMIUM_MO ||
  !process.env.PREMIUM_YR ||
  !process.env.PREMIUM_PLUS_MO ||
  !process.env.PREMIUM_PLUS_YR
  // !process.env.STATIC_DIR
) {
  console.log(
    'The .env file is not configured. Follow the instructions in the readme to configure the .env file. https://github.com/stripe-samples/subscription-use-cases'
  );
  console.log('');
  process.env.STRIPE_SECRET_KEY
    ? ''
    : console.log('Add STRIPE_SECRET_KEY to your .env file.');

  process.env.STRIPE_PUBLISHABLE_KEY
    ? ''
    : console.log('Add STRIPE_PUBLISHABLE_KEY to your .env file.');

  process.env.PREMIUM_MO
    ? ''
    : console.log(
        'Add PREMIUM_MO priceID to your .env file. See repo readme for setup instructions.'
      );
  process.env.PREMIUM_YR
    ? ''
    : console.log(
        'Add PREMIUM_YR priceID to your .env file. See repo readme for setup instructions.'
      );

  process.env.PREMIUM_PLUS_MO
    ? ''
    : console.log(
        'Add PREMIUM_PLUS_MO priceID to your .env file. See repo readme for setup instructions.'
      );
  process.env.PREMIUM_PLUS_YR
    ? ''
    : console.log(
        'Add PREMIUM_PLUS_YR priceID to your .env file. See repo readme for setup instructions.'
      );

  // process.env.STATIC_DIR
  //   ? ''
  //   : console.log(
  //       'Add STATIC_DIR to your .env file. Check .env.example in the root folder for an example'
  //     );

  process.exit();
}

module.exports = {
  createCustomer: async (req, res) => {
    // Create a new customer object
    const customer = await stripe.customers.create({
      email: req.body.email,
    });
    // save the customer.id as stripeCustomerId
    // in your database.

    res.send({ customer });
  },

  createSubscription: async (req, res) => {
    console.log('req.body:', req.body);
    req.body.priceId = req.body.priceId.replace(' ', '_');
    // Set the default payment method on the customer
    try {
      await stripe.paymentMethods.attach(req.body.paymentMethodId, {
        customer: req.body.customerId,
      });
    } catch (error) {
      return res.status('402').send({ error: { message: error.message } });
    }

    let updateCustomerDefaultPaymentMethod = await stripe.customers.update(
      req.body.customerId,
      {
        invoice_settings: {
          default_payment_method: req.body.paymentMethodId,
        },
      }
    );
    try {
      console.log(
        'process.env[req.body.priceId]:',
        process.env[req.body.priceId]
      );
      // Create the subscription
      const subscription = await stripe.subscriptions.create({
        customer: req.body.customerId,
        items: [{ price: process.env[req.body.priceId] }],
        expand: ['latest_invoice.payment_intent'],
      });
      console.log('subscription:', subscription);
      savePlanToDb(req, res);
      saveSubscriptionToDb(subscription.customer, subscription.id);
      res.send(subscription);
    } catch (err) {
      console.log('err:', err);
    }
  },

  savePlanToDb: (req, res) => {
    savePlanToDb(req, res);
  },

  retryInvoice: async (req, res) => {
    // Set the default payment method on the customer

    try {
      await stripe.paymentMethods.attach(req.body.paymentMethodId, {
        customer: req.body.customerId,
      });
      await stripe.customers.update(req.body.customerId, {
        invoice_settings: {
          default_payment_method: req.body.paymentMethodId,
        },
      });
    } catch (error) {
      // in case card_decline error
      return res
        .status('402')
        .send({ result: { error: { message: error.message } } });
    }

    const invoice = await stripe.invoices.retrieve(req.body.invoiceId, {
      expand: ['payment_intent'],
    });
    res.send(invoice);
  },

  upcomingInvoice: async (req, res) => {
    const subscription = await stripe.subscriptions.retrieve(
      req.body.subscriptionId
    );

    const invoice = await stripe.invoices.retrieveUpcoming({
      subscription_prorate: true,
      customer: req.body.customerId,
      subscription: req.body.subscriptionId,
      subscription_items: [
        {
          id: subscription.items.data[0].id,
          deleted: true,
        },
        {
          price: process.env[req.body.newPriceId],
          deleted: false,
        },
      ],
    });
    res.send(invoice);
  },

  cancelSubscription: async (req, res) => {
    const customer = await db.one(
      'SELECT customer_id, subscription_id FROM owners WHERE owner_id = ${ownerId}',
      { ownerId: req.body.ownerId }
    );
    try {
      // Delete the subscription
      const deletedSubscription = await stripe.subscriptions.del(
        customer.subscriptionId
      );

      savePlanToDb(
        { body: { customerId: deletedSubscription.customer, plan: 'basic' } },
        res
      );

      res.send({ subCancelled: true, msg: 'none' });
      // res.send(deletedSubscription);
    } catch (err) {
      console.log('err:', err);
      if (err.message.toLowerCase().includes('no such subscription')) {
        res.send({ subCancelled: false, msg: err.message });
      }
    }
  },

  updateSubscription: async (req, res) => {
    const customer = await db.one(
      'SELECT customer_id, subscription_id FROM owners WHERE owner_id = ${ownerId}',
      req.body
    );

    const subscription = await stripe.subscriptions.retrieve(
      customer.subscriptionId
    );

    const prices = await stripe.prices.list();

    let newPriceId = '';
    prices.data.forEach((price) => {
      if (
        price.lookup_key.split(' ').slice(0, -1).join(' ') ==
        req.body.newPriceId
      ) {
        newPriceId = price.id;
      }
    });
    try {
      const updatedSubscription = await stripe.subscriptions.update(
        customer.subscriptionId,
        {
          cancel_at_period_end: false,
          items: [
            {
              id: subscription.items.data[0].id,
              price: newPriceId,
            },
          ],
        }
      );
      if (updatedSubscription) {
        req.body.plan = lowercaseFirstLetter(
          req.body.newPriceId.replace(' ', '')
        );
        req.body.customerId = customer.customerId;
        const quota = savePlanToDb(req, res);
        res.send({ subUpdated: true, msg: 'none'});
      }
    } catch (err) {
      console.log('err:', err);
      if (err.message.toLowerCase().includes('no such subscription')) {
        res.send({ subUpdated: false, msg: err.message });
      }
    }
  },

  paymentMethod: async (req, res) => {
    const customer = await db.one(
      'SELECT customer_id, plan FROM owners WHERE owner_id = ${ownerId}',
      { ownerId: req.body.ownerId }
    );
    console.log('customer:', customer);
    const response = await stripe.paymentMethods.list({
      customer: customer.customerId,
      type: 'card',
    });
    // console.log('response:', response);
    const planDetails = {
      cardBrand:
        capitalizeFirstLetter(response.data[0].card.brand),
      lastFour:
        response.data[0].card.last4,
      plan:
        customer.plan.charAt(0).toUpperCase() +
        customer.plan
          .slice(1)
          .split(/(?=[A-Z])/)
          .join(' '),
    };
    res.send(planDetails);
  },

  stripeWebhook: async (req, res) => {
    // Retrieve the event by verifying the signature using the raw body and secret.
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        req.header('Stripe-Signature'),
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.log(err);
      console.log(`⚠️  Webhook signature verification failed.`);
      console.log(
        `⚠️  Check the env file and enter the correct webhook secret.`
      );
      return res.sendStatus(400);
    }
    // Extract the object from the event.
    const dataObject = event.data.object;

    // Handle the event
    // Review important events for Billing webhooks
    // https://stripe.com/docs/billing/webhooks
    // Remove comment to see the various objects sent for this sample
    switch (event.type) {
      case 'invoice.paid':
        // Used to provision services after the trial has ended.
        // The status of the invoice will show up as paid. Store the status in your
        // database to reference when a user accesses your service to avoid hitting rate limits.
        break;
      case 'invoice.payment_failed':
        // If the payment fails or the customer does not have a valid payment method,
        //  an invoice.payment_failed event is sent, the subscription becomes past_due.
        // Use this webhook to notify your user that their payment has
        // failed and to retrieve new card details.
        break;
      case 'invoice.finalized':
        // If you want to manually send out invoices to your customers
        // or store them locally to reference to avoid hitting Stripe rate limits.
        break;
      case 'customer.subscription.deleted':
        if (event.request != null) {
          // handle a subscription cancelled by your request
          // from above.
        } else {
          // handle subscription cancelled automatically based
          // upon your subscription settings.
        }
        break;
      case 'customer.subscription.trial_will_end':
        // Send notification to your user that the trial will end
        break;
      default:
      // Unexpected event type
    }
    res.sendStatus(200);
  },
};

async function savePlanToDb(req, res) {
  req.body.plan = req.body.plan || req.body.priceId.split('_')[0].toLowerCase();
  const quota = {
    basic: 2000,
    premium: 20000,
    premiumPlus: 100000,
  };
  try {
    const owner = await db.one(
      'UPDATE owners SET plan = ${plan}, quota = ${quota} WHERE customer_id = ${customerId} RETURNING owner_id, plan',
      { ...req.body, quota: quota[req.body.plan] }
    );
    res.status(200).end();
  } catch (err) {
    res.status(500).end();
  }
}

async function saveSubscriptionToDb(customerId, subscriptionId) {
  await db.one(
    'UPDATE owners SET subscription_id = ${subscriptionId} WHERE customer_id = ${customerId} RETURNING owner_id, subscription_id',
    { customerId, subscriptionId }
  );
}

function capitalizeFirstLetter(string) {
  let tempString = string.toLowerCase();
  return tempString.charAt(0).toUpperCase() + tempString.slice(1);
}
function lowercaseFirstLetter(string) {
  // let tempString = string
  return string.charAt(0).toLowerCase() + string.slice(1);
}
