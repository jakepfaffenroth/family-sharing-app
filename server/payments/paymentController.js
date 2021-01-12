const db = require('../db').pgPromise;

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
  saveBasic: async (req, res) => {
    const { customerId, plan } = req.body;

    const subscription = await createSubscription(customerId, plan);

    saveToDb(customerId, plan, subscription.id)
      ? res.status(200).end()
      : res.status(500).end();
  },

  // Creates checkout session to collect payment info
  createCheckoutSession: async function (req, res) {
    const { ownerId, referrer, type } = req.body;
    const plan = req.body.plan || req.body.newPlan;

    const {
      customerId,
      subscriptionId,
    } = await db.one(
      'SELECT customer_id, subscription_id FROM owners WHERE owner_id = $1',
      [ownerId]
    );

    const sessionParams = {
      customer: customerId,
      payment_method_types: ['card'],

      success_url:
        process.env.SERVER +
        `/payment/finalize-checkout?sesId={CHECKOUT_SESSION_ID}&cusId=${customerId}&subid=${subscriptionId}&plan=${plan}&referrer=${referrer}&type=${type}`,
      cancel_url: req.get('referrer'),
    };

    switch (type) {
      case 'new':
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

    res.json({ id: session.id, customer: session.customer });
  },

  // After payment, redirected here
  // Saves default method method if none exists
  // Updates subscription if type === update
  // Saves new subscription info to DB
  // Redirects client back to account or login
  finalizeCheckout: async (req, res) => {
    const {
      sesId: sessionId,
      cusId: customerId,
      subid: subscriptionId,
      plan,
      referrer,
      type,
    } = req.query;

    // Check for a default payment method and if none, save it
    await saveDefaultPaymentMethod(sessionId);

    const price = prices[plan].id;

    if (type === 'update') {
      await updateSubscription(subscriptionId, price);
    }

    await saveToDb(customerId, plan, subscriptionId);

    if (referrer === 'client') {
      res.redirect(process.env.CLIENT + 'account');
    } else {
      res.redirect('/login');
    }
  },

  // Retrieves subscription from Stripe, updates it with new plan, calls saveToDb()
  updateSubscription: async function (req, res) {
    const { ownerId, newPlan } = req.body;
    const newPriceId = prices[newPlan].id;

    const {
      customerId,
      subscriptionId,
    } = await db.one(
      'SELECT customer_id, subscription_id FROM owners WHERE owner_id = ${ownerId}',
      { ownerId }
    );

    try {
      const updatedSubscription = updateSubscription(
        subscriptionId,
        newPriceId
      );

      if (updatedSubscription) {
        saveToDb(customerId, newPlan, subscriptionId)
          ? res.send({ subUpdated: true, msg: 'none' })
          : res.send({ subUpdated: false, msg: 'none' });
      }
    } catch (err) {
      console.error('err:', err);
      if (err.message.toLowerCase().includes('no such subscription')) {
        res.send({ subUpdated: false, msg: err.message });
      }
    }
  },

  // Retrieves plan name, card brand, and last four digits and sends to client
  retrievePaymentMethod: async (req, res) => {
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

  // Event listeners for Stripe events
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
    console.log('dataObject:', dataObject);

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await saveDefaultPaymentMethod(dataObject.id);
        break;
      case 'invoice.payment_failed':
        await db.one(
          "UPDATE owners SET payment_status = 'failed' WHERE owner_id"
        );
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

async function createSubscription(customerId, plan) {
  const priceId = prices[plan].id;

  return await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
  });
}

async function updateSubscription(subscriptionId, price) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
    items: [
      {
        id: subscription.items.data[0].id,
        price,
      },
    ],
  });
}

// Save new plan, quota, and subscriptionId to DB
async function saveToDb(customerId, plan, subscriptionId) {
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

// Save customer default payment method
async function saveDefaultPaymentMethod(sessionId) {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['setup_intent', 'customer'],
  });

  if (session.customer.default_source) return;

  const { customer, metadata, payment_method } = await stripe.customers.update(
    session.customer.id,
    {
      invoice_settings: {
        default_payment_method: session.setup_intent.payment_method,
      },
    }
  );
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
