const db = require('../db').pgPromise;
const { debug, info } = require('winston');
const stripeWebhook = require('./stripeWebhook');

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

const prices = {
  basic: { id: 'price_1I5xanCto9koSaMfwX740oI3', quota: 500 },
  premiumMo: { id: 'price_1I5xbACto9koSaMfaeVUf7lJ', quota: 2500 },
  premiumYr: { id: 'price_1I5xbACto9koSaMfZ7rT1glq', quota: 2500 },
};

module.exports = {
  createCustomer: async (req, res) => {
    // Create a new customer object
    const customer = await stripe.customers.create({
      email: req.body.email,
      metadata: { ownerId: req.body.ownerId },
    });
    // save the customer.id as stripeCustomerId
    // in your database.

    res.send({ customer });
  },

  // createSubscription: async (req, res) => {
  //   const priceId = req.body.priceId.replace(' ', '_');

  //   const customerId = req.body.customerId
  //   const plan = Object.keys(prices).find(key => prices[key].id === priceId)

  //   // Set the default payment method on the customer
  //   try {
  //     await stripe.paymentMethods.attach(req.body.paymentMethodId, {
  //       customer: customerId,
  //     });
  //   } catch (error) {
  //     return res.status('402').send({ error: { message: error.message } });
  //   }

  //   let updateCustomerDefaultPaymentMethod = await stripe.customers.update(
  //     req.body.customerId,
  //     {
  //       invoice_settings: {
  //         default_payment_method: req.body.paymentMethodId,
  //       },
  //     }
  //   );
  //   try {
  //     console.log(
  //       'process.env[req.body.priceId]:',
  //       process.env[req.body.priceId]
  //     );
  //     // Create the subscription
  //     const subscription = await stripe.subscriptions.create({
  //       customer: customerId,
  //       items: [{ price: process.env[req.body.priceId] }],
  //       expand: ['latest_invoice.payment_intent'],
  //     });
  //     console.log('subscription:', subscription);
  //     const savedToDb = await savePlanToDb(customerId, plan);
  //     saveSubscriptionToDb(subscription.customer, subscription.id);
  //     res.send(subscription);
  //   } catch (err) {
  //     console.log('err:', err);
  //   }
  // },

  saveBasic: async (req, res) => {
    const customer = req.body.customerId;
    const plan = lowercaseFirstLetter(req.body.plan);
    const price = prices[plan].id;
    const subscription = await stripe.subscriptions.create({
      customer,
      items: [{ price }],
    });

    savePlanToDb(customer, plan, subscription.id)
      ? res.status(200).end()
      : res.status(500).end();
  },

  createCheckoutSession: async function (req, res) {
    const { referrer, type } = req.body;
    console.log('type:', type);

    const {
      customerId,
      subscriptionId,
    } = await db.one(
      'SELECT customer_id, subscription_id FROM owners WHERE owner_id = $1',
      [req.body.ownerId]
    );

    const sessionParams = {
      customer: customerId,
      payment_method_types: ['card'],

      success_url:
        process.env.SERVER +
        `/payment/finalize-checkout?id=${customerId}&referrer=${referrer}`,
      cancel_url: req.get('referrer'),
    };

    switch (type) {
      case 'new':
        const plan = req.body.plan || req.body.newPlan;
        const priceId = prices[plan].id;

        sessionParams.mode = 'subscription';
        sessionParams.line_items = [{ price: priceId, quantity: 1 }];
        sessionParams.subscription_data = {
          metadata: {
            planName: plan,
            isPremium: plan.includes('premium'),
          },
        };
        sessionParams.allow_promotion_codes = true;
        sessionParams.expand = ['customer.sources.data'];

        break;
      case 'update':
        sessionParams.mode = 'setup';
        sessionParams.setup_intent_data = {
          metadata: {
            customer_id: customerId,
            subscription_id: subscriptionId,
          },
        };
        break;

      default:
        res.status(500).end();
        break;
    }
    const session = await stripe.checkout.sessions.create(sessionParams);
    console.log('session:', session);
    res.json({ id: session.id, customer: session.customer });
  },

  finalizeCheckout: async (req, res) => {
    const customer = req.query.customerId;
    const referrer = req.query.referrer;

    const subscriptions = (
      await stripe.subscriptions.list({
        customer,
        status: 'active',
        limit: 1,
      })
    ).data;

    const subscription = subscriptions[0];
    const plan = subscription.metadata.planName;
    const quota = prices[plan].quota;

    try {
      await db.none(
        'UPDATE owners SET subscription_id = ${id}, plan = ${plan}, quota = ${quota} WHERE customer_id = ${customer}',
        { ...subscription, plan, quota }
      );

      if (referrer === 'client') {
        res.redirect(process.env.CLIENT + 'account');
      } else {
        res.redirect('/login');
      }
    } catch (err) {
      error(err);
    }
  },

  // retryInvoice: async (req, res) => {
  //   // Set the default payment method on the customer

  //   try {
  //     await stripe.paymentMethods.attach(req.body.paymentMethodId, {
  //       customer: req.body.customerId,
  //     });
  //     await stripe.customers.update(req.body.customerId, {
  //       invoice_settings: {
  //         default_payment_method: req.body.paymentMethodId,
  //       },
  //     });
  //   } catch (error) {
  //     // in case card_decline error
  //     return res
  //       .status('402')
  //       .send({ result: { error: { message: error.message } } });
  //   }

  //   const invoice = await stripe.invoices.retrieve(req.body.invoiceId, {
  //     expand: ['payment_intent'],
  //   });
  //   res.send(invoice);
  // },

  // upcomingInvoice: async (req, res) => {
  //   const subscription = await stripe.subscriptions.retrieve(
  //     req.body.subscriptionId
  //   );

  //   const invoice = await stripe.invoices.retrieveUpcoming({
  //     subscription_prorate: true,
  //     customer: req.body.customerId,
  //     subscription: req.body.subscriptionId,
  //     subscription_items: [
  //       {
  //         id: subscription.items.data[0].id,
  //         deleted: true,
  //       },
  //       {
  //         price: process.env[req.body.newPriceId],
  //         deleted: false,
  //       },
  //     ],
  //   });
  //   res.send(invoice);
  // },

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

      savePlanToDb(deletedSubscription.customer, 'basic')
        ? res.status(200).end()
        : res.status(500).end();

      res.send({ subCancelled: true, msg: 'none' });
    } catch (err) {
      console.log('err:', err);
      if (err.message.toLowerCase().includes('no such subscription')) {
        res.send({ subCancelled: false, msg: err.message });
      }
    }
  },

  updateSubscription: async function (req, res) {
    const { ownerId } = req.body;
    const newPlan = lowercaseFirstLetter(req.body.newPlan);
    const newPriceId = prices[newPlan].id;
    console.log('ownerId:', ownerId);
    const {
      customerId,
      subscriptionId,
    } = await db.one(
      'SELECT customer_id, subscription_id FROM owners WHERE owner_id = ${ownerId}',
      { ownerId }
    );
    console.log('customerId:', customerId);
    console.log('subscriptionId:', subscriptionId);
    console.log('newPlan:', newPlan);
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // if (newPlan.includes('premium')) {
    //   res.locals.customerId = customerId;
    //   const session = await module.exports.createCheckoutSession(req, res);

    //   const result = await stripe.redirectToCheckout({
    //     // sessionId: session.json().id,
    //     sessionId: session.id,
    //     clientReferenceId: customerId,
    //   });
    //   if (result.error) {
    //     res.status(500).end();
    //   }
    // }

    try {
      const updatedSubscription = await stripe.subscriptions.update(
        subscriptionId,
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
      console.log('updatedSubscription:', updatedSubscription);
      if (updatedSubscription) {
        const savedToDb = savePlanToDb(customerId, newPlan, subscriptionId);
        if (savedToDb) {
          res.send({ subUpdated: true, msg: 'none' });
        }
      }
    } catch (err) {
      console.error('err:', err);
      if (err.message.toLowerCase().includes('no such subscription')) {
        res.send({ subUpdated: false, msg: err.message });
      }
    }
  },

  retrievePaymentMethod: async (req, res) => {
    // Retrieves plan name, card brand, and last four digits and sends to client
    const customer = await db.one(
      'SELECT customer_id, plan FROM owners WHERE owner_id = ${ownerId}',
      { ownerId: req.body.ownerId }
    );

    const response = await stripe.paymentMethods.list({
      customer: customer.customerId,
      type: 'card',
    });

    // Set plan to null if one hasn't been picked yet
    customer.plan = customer.plan || null;

    const planDetails = {
      paymentMethodOnFile: response.data.length > 0,
      cardBrand: response.data[0]
        ? capitalizeFirstLetter(response.data[0].card.brand)
        : null,
      lastFour: response.data[0] ? response.data[0].card.last4 : null,
      plan: customer.plan,
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
      return res.sendStatus(500);
    }
    // Extract the object from the event.
    const dataObject = event.data.object;

    // Handle the event
    // Review important events for Billing webhooks
    // https://stripe.com/docs/billing/webhooks
    // Remove comment to see the various objects sent for this sample
    switch (event.type) {
      case 'checkout.session.completed':
        const session = await stripe.checkout.sessions.retrieve(
          event.data.object.id,
          { expand: ['setup_intent'] }
        );
        console.log('sessionX:', session);
        const {
          customer,
          metadata,
          payment_method,
        } = await stripe.customers.update(session.customer, {
          invoice_settings: {
            default_payment_method: session.setup_intent.payment_method,
          },
        });
        break;
      case 'account.updated':
        console.log('event:', event);
        break;
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
        console.log('event:', event);
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

async function savePlanToDb(customerId, plan, subscriptionId) {
  const quota = prices[plan].quota;
  const values = { customerId, plan, quota };
  if (subscriptionId) values.subscriptionId = subscriptionId;

  try {
    await db.one(
      'UPDATE owners SET plan = ${plan}, quota = ${quota}, subscription_id = ${subscriptionId} WHERE customer_id = ${customerId} RETURNING owner_id, plan',
      values
    );
    return;
  } catch (err) {
    return false;
  }
}

// async function saveSubscriptionToDb(customerId, subscriptionId) {
//   await db.one(
//     'UPDATE owners SET subscription_id = ${subscriptionId} WHERE customer_id = ${customerId} RETURNING owner_id, subscription_id',
//     { customerId, subscriptionId }
//   );
// }

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
function lowercaseFirstLetter(string) {
  return string.charAt(0).toLowerCase() + string.slice(1);
}
