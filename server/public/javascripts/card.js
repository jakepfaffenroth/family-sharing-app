// window.location =
//   '/prices?customerId=' + document.getElementById('customer-id').innerText;

let stripe, customer, price, card;

const toggleCheckbox = document.getElementById('toggle-checkbox');

const btns = {
  basic: document.getElementById('btn-basic'),
  premium: document.getElementById('btn-premium'),
  premiumPlus: document.getElementById('btn-premium-plus'),
};
let subscriptionTerm;

function toggleSubscriptionTerm() {
  toggleCheckbox.checked
    ? (subscriptionTerm = 'Mo')
    : (subscriptionTerm = 'Yr');
}

toggleSubscriptionTerm();

Object.keys(btns).forEach((key) => {
  console.log('btns[key].value:', btns[key].value);
  if (btns[key].value.includes('basic')) {
    btns[key].addEventListener('click', () => {
      showSubscriptionCompleteModal(btns[key].value);
      // toggleSuccessModal(document.getElementById('success-modal'));
    });
  } else {
    btns[key].addEventListener('click', () => {
      goToPaymentPage(btns[key].value + subscriptionTerm, subscriptionTerm);
    });
  }
});

function stripeElements() {
  stripe = Stripe(
    'pk_test_51HYjdCCto9koSaMfB1vfa2yKqEHrKbyEg0CHfL31Xck4Kom1QgvYSYhEy0G27aSwa2Ydy3RSmX9YxDFvdVNEIHz40032As5FXu'
  ); // Your Publishable Key

  if (document.getElementById('card-element')) {
    const elements = stripe.elements();

    // Create our card inputs
    const style = {
      base: {
        color: '#fff',
      },
    };

    const classes = {
      base:
        'rounded-md relative px-3 py-2 border border-gray-400 placeholder-gray-500 text-gray-900  focus:outline-none focus:shadow-outline-blue focus:border-blue-300 focus:z-10 sm:text-sm sm:leading-5',
    };

    card = elements.create('card', { style, classes });
    card.mount('#card-element');

    card.on('focus', function () {
      let el = document.getElementById('card-element-errors');
      el.classList.add('focused');
    });

    card.on('blur', function () {
      let el = document.getElementById('card-element-errors');
      el.classList.remove('focused');
    });

    card.on('change', function (event) {
      displayError(event);
    });
  }

  let signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', function (e) {
      e.preventDefault();
      changeLoadingState(true);
      // Create customer
      createCustomer().then((result) => {
        customer = result.customer;

        window.location.href = '/prices.html?customerId=' + customer.id;
      });
    });
  }

  let paymentForm = document.getElementById('payment-form');
  if (paymentForm) {
    paymentForm.addEventListener('submit', function (e) {
      e.preventDefault();
      changeLoadingStatePrices(true);

      // If a previous payment was attempted, get the lastest invoice
      const latestInvoicePaymentIntentStatus = localStorage.getItem(
        'latestInvoicePaymentIntentStatus'
      );

      if (latestInvoicePaymentIntentStatus === 'requires_payment_method') {
        const invoiceId = localStorage.getItem('latestInvoiceId');
        const isPaymentRetry = true;
        // create new payment method & retry payment on invoice with new payment method
        createPaymentMethod({
          card,
          isPaymentRetry,
          invoiceId,
        });
      } else {
        // create new payment method & create subscription
        createPaymentMethod({ card });
      }
    });
  }
}

const form = document.querySelector('form');
const errorEl = document.querySelector('#card-errors');

// Give our token to our form
const stripeTokenHandler = async (token, e) => {
  const hiddenInput = document.createElement('input');
  hiddenInput.setAttribute('type', 'hidden');
  hiddenInput.setAttribute('name', 'stripeToken');
  hiddenInput.setAttribute('value', token.id);
  form.appendChild(hiddenInput);
};

// Create token from card data
form.addEventListener('submit', (e) => {
  e.preventDefault();
  stripe.createToken(card).then((res) => {
    if (res.error) errorEl.textContent = res.error.message;
    else stripeTokenHandler(res.token, e);
  });
});

// ! =================================================== ! //

let priceInfo = {
  basicMo: {
    amount: '0',
    name: 'Basic',
    interval: '',
    currency: '',
  },
  basicYr: {
    amount: '0',
    name: 'Basic',
    interval: '',
    currency: '',
  },
  premiumMo: {
    amount: '5',
    name: 'Premium',
    interval: 'monthly',
    currency: 'USD',
  },
  premiumYr: {
    amount: '45',
    name: 'Premium',
    interval: 'yearly',
    currency: 'USD',
  },
  premiumPlusMo: {
    amount: '10',
    name: 'Premium Plus',
    interval: 'monthly',
    currency: 'USD',
  },
  premiumPlusYr: {
    amount: '95',
    name: 'Premium Plus',
    interval: 'yearly',
    currency: 'USD',
  },
};

function displayError(event) {
  changeLoadingStatePrices(false);
  let displayError = document.getElementById('card-element-errors');
  if (event.error) {
    displayError.textContent = event.error.message;
  } else {
    displayError.textContent = '';
  }
}

function createPaymentMethod({ card, isPaymentRetry, invoiceId }) {
  const params = new URLSearchParams(document.location.search.substring(1));
  const customerId = params.get('customerId');
  // Set up payment method for recurring usage
  let billingName = document.querySelector('#name').value;

  let priceId = (
    document.getElementById('priceId').innerHTML +
    '_' +
    subscriptionTerm
  ).toUpperCase();

  stripe
    .createPaymentMethod({
      type: 'card',
      card: card,
      billing_details: {
        name: billingName,
      },
    })
    .then((result) => {
      if (result.error) {
        displayError(result);
      } else {
        if (isPaymentRetry) {
          // Update the payment method and retry invoice payment
          retryInvoiceWithNewPaymentMethod({
            customerId: customerId,
            paymentMethodId: result.paymentMethod.id,
            invoiceId: invoiceId,
            priceId: priceId,
          });
        } else {
          // Create the subscription
          createSubscription({
            customerId: customerId,
            paymentMethodId: result.paymentMethod.id,
            priceId: priceId,
          });
        }
      }
    });
}

function updatePlan(priceId, subscriptionTerm) {
  document.getElementById('total-due-now').innerText = getFormattedAmount(
    priceInfo[priceId].amount
  );
  document.getElementById(
    'subscription-term'
  ).innerText = subscriptionTerm
    .replace('Mo', 'monthly')
    .replace('Yr', 'yearly');

  // Add the price selected
  document.getElementById('price-selected').innerHTML =
    '→ Subscribing to ' +
    '<span id="priceId" class="font-bold">' +
    priceInfo[priceId].name +
    '</span>';
}

function goToPaymentPage(priceId, subscriptionTerm) {
  // Show the payment screen
  const paymentForm = document.querySelector('#payment-form');

  if (priceId.toLowerCase().includes('basic')) {
    const successModal = document.getElementById('success-modal');
    // successModal.querySelector('header')
    toggleSuccessModal(successModal);
  }

  paymentForm.classList.remove('hidden');
  paymentForm.scrollIntoView({
    behavior: 'smooth',
  });

  updatePlan(priceId, subscriptionTerm);

  // Show which price the user selected
  switch (priceId) {
    case 'basicMo':
    case 'basicYr':
      btns.basic.innerText = 'Selected';
      btns.premium.innerText = 'Select';
      btns.premiumPlus.innerText = 'Select';
      break;
    case 'premiumMo':
    case 'premiumYr':
      btns.basic.innerText = 'Select';
      btns.premium.innerText = 'Selected';
      btns.premiumPlus.innerText = 'Select';
      break;
    case 'premiumPlusMo':
    case 'premiumPlusYr':
      btns.basic.innerText = 'Select';
      btns.premium.innerText = 'Select';
      btns.premiumPlus.innerText = 'Selected';
      break;
  }

  // if (priceId.includes('premium') && !priceId.includes('Plus')) {
  //   document.querySelector('#submit-premium-button-text').innerText =
  //     'Selected';
  //   document.querySelector('#submit-basic-button-text').innerText = 'Select';
  // } else {
  //   document.querySelector('#submit-premium-button-text').innerText = 'Select';
  //   document.querySelector('#submit-basic-button-text').innerText = 'Selected';
  // }

  // Update the border to show which price is selected
  changePriceSelection(priceId);
}

// function changePrice() {
//   demoChangePrice();
// }

function switchPrices(newPriceIdSelected) {
  const params = new URLSearchParams(document.location.search.substring(1));
  const currentSubscribedpriceId = params.get('priceId');
  const customerId = params.get('customerId');
  const subscriptionId = params.get('subscriptionId');
  // Update the border to show which price is selected
  changePriceSelection(newPriceIdSelected);

  changeLoadingStatePrices(true);

  // Retrieve the upcoming invoice to display details about
  // the price change
  retrieveUpcomingInvoice(customerId, subscriptionId, newPriceIdSelected).then(
    (upcomingInvoice) => {
      // Change the price details for price upgrade/downgrade
      // calculate if it's upgrade or downgrade
      document.getElementById(
        'current-price-subscribed'
      ).innerHTML = capitalizeFirstLetter(currentSubscribedpriceId);

      document.getElementById(
        'new-price-selected'
      ).innerText = capitalizeFirstLetter(newPriceIdSelected);

      document.getElementById('new-price-price-selected').innerText =
        '$' + upcomingInvoice.amount_due / 100;

      let nextPaymentAttemptDateToDisplay = getDateStringFromUnixTimestamp(
        upcomingInvoice.next_payment_attempt
      );
      document.getElementById(
        'new-price-start-date'
      ).innerHTML = nextPaymentAttemptDateToDisplay;

      changeLoadingStatePrices(false);
    }
  );

  if (currentSubscribedpriceId != newPriceIdSelected) {
    document.querySelector('#price-change-form').classList.remove('hidden');
  } else {
    document.querySelector('#price-change-form').classList.add('hidden');
  }
}

function confirmPriceChange() {
  const params = new URLSearchParams(document.location.search.substring(1));
  const subscriptionId = params.get('subscriptionId');
  let newPriceId = document.getElementById('new-price-selected').innerHTML;

  updateSubscription(newPriceId.toUpperCase(), subscriptionId).then(
    (result) => {
      let searchParams = new URLSearchParams(window.location.search);
      searchParams.set('priceId', newPriceId.toUpperCase());
      searchParams.set('priceHasChanged', true);
      window.location.search = searchParams.toString();
    }
  );
}

async function createCustomer() {
  let billingEmail = document.querySelector('#email').value;
  let name = document.getElementById('name').value;
  console.log('name:', name);
  return await fetch('/create-customer', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: name,
      email: billingEmail,
    }),
  })
    .then((response) => {
      return response.json();
    })
    .then((result) => {
      return result;
    });
}

function handlePaymentThatRequiresCustomerAction({
  subscription,
  invoice,
  priceId,
  paymentMethodId,
  isRetry,
}) {
  if (subscription && subscription.status === 'active') {
    // subscription is active, no customer actions required.
    return { subscription, priceId, paymentMethodId };
  }

  // If it's a first payment attempt, the payment intent is on the subscription latest invoice.
  // If it's a retry, the payment intent will be on the invoice itself.
  let paymentIntent = invoice
    ? invoice.payment_intent
    : subscription.latest_invoice.payment_intent;

  if (
    paymentIntent.status === 'requires_action' ||
    (isRetry === true && paymentIntent.status === 'requires_payment_method')
  ) {
    return stripe
      .confirmCardPayment(paymentIntent.client_secret, {
        payment_method: paymentMethodId,
      })
      .then((result) => {
        if (result.error) {
          // start code flow to handle updating the payment details
          // Display error message in your UI.
          // The card was declined (i.e. insufficient funds, card has expired, etc)
          throw result;
        } else {
          if (result.paymentIntent.status === 'succeeded') {
            // There's a risk of the customer closing the window before callback
            // execution. To handle this case, set up a webhook endpoint and
            // listen to invoice.paid. This webhook endpoint returns an Invoice.
            return {
              priceId: priceId,
              subscription: subscription,
              invoice: invoice,
              paymentMethodId: paymentMethodId,
            };
          }
        }
      });
  } else {
    // No customer action needed
    return { subscription, priceId, paymentMethodId };
  }
}

function handleRequiresPaymentMethod({
  subscription,
  paymentMethodId,
  priceId,
}) {
  if (subscription.status === 'active') {
    // subscription is active, no customer actions required.
    return { subscription, priceId, paymentMethodId };
  } else if (
    subscription.latest_invoice.payment_intent.status ===
    'requires_payment_method'
  ) {
    // Using localStorage to store the state of the retry here
    // (feel free to replace with what you prefer)
    // Store the latest invoice ID and status
    localStorage.setItem('latestInvoiceId', subscription.latest_invoice.id);
    localStorage.setItem(
      'latestInvoicePaymentIntentStatus',
      subscription.latest_invoice.payment_intent.status
    );
    throw { error: { message: 'Your card was declined.' } };
  } else {
    return { subscription, priceId, paymentMethodId };
  }
}

function onSubscriptionComplete(result) {
  // console.log('result:', result);
  // Payment was successful. Provision access to your service.
  // Remove invoice from localstorage because payment is now complete.
  clearCache();
  // Change your UI to show a success message to your customer.
  showSubscriptionCompleteModal(result.priceId);
  // onSubscriptionSampleDemoComplete(result);
  // Call your backend to grant access to your service based on
  // the product your customer subscribed to.
  // Get the product by using result.subscription.price.product
}

function createSubscription({ customerId, paymentMethodId, priceId }) {
  return (
    fetch('/payment/create-subscription', {
      method: 'post',
      headers: {
        'Content-type': 'application/json',
      },
      body: JSON.stringify({
        customerId: document.getElementById('id').dataset.customerId,
        paymentMethodId: paymentMethodId,
        priceId: priceId,
      }),
    })
      .then((response) => {
        return response.json();
      })
      // If the card is declined, display an error to the user.
      .then((result) => {
        if (result.error) {
          // The card had an error when trying to attach it to a customer
          throw result;
        }
        return result;
      })
      // Normalize the result to contain the object returned
      // by Stripe. Add the addional details we need.
      .then((result) => {
        return {
          // Use the Stripe 'object' property on the
          // returned result to understand what object is returned.
          subscription: result,
          paymentMethodId: paymentMethodId,
          priceId: priceId,
        };
      })
      // Some payment methods require a customer to do additional
      // authentication with their financial institution.
      // Eg: 2FA for cards.
      .then(handlePaymentThatRequiresCustomerAction)
      // If attaching this card to a Customer object succeeds,
      // but attempts to charge the customer fail. You will
      // get a requires_payment_method error.
      .then(handleRequiresPaymentMethod)
      // No more actions required. Provision your service for the user.
      .then(onSubscriptionComplete)
      .catch((error) => {
        // An error has happened. Display the failure to the user here.
        // We utilize the HTML element we created.
        displayError(error);
      })
  );
}

function retryInvoiceWithNewPaymentMethod({
  customerId,
  paymentMethodId,
  invoiceId,
  priceId,
}) {
  return (
    fetch('/retry-invoice', {
      method: 'post',
      headers: {
        'Content-type': 'application/json',
      },
      body: JSON.stringify({
        customerId: customerId,
        paymentMethodId: paymentMethodId,
        invoiceId: invoiceId,
      }),
    })
      .then((response) => {
        return response.json();
      })
      // If the card is declined, display an error to the user.
      .then((result) => {
        if (result.error) {
          // The card had an error when trying to attach it to a customer
          throw result;
        }
        return result;
      })
      // Normalize the result to contain the object returned
      // by Stripe. Add the addional details we need.
      .then((result) => {
        return {
          // Use the Stripe 'object' property on the
          // returned result to understand what object is returned.
          invoice: result,
          paymentMethodId: paymentMethodId,
          priceId: priceId,
          isRetry: true,
        };
      })
      // Some payment methods require a customer to be on session
      // to complete the payment process. Check the status of the
      // payment intent to handle these actions.
      .then(handlePaymentThatRequiresCustomerAction)
      // No more actions required. Provision your service for the user.
      .then(onSubscriptionComplete)
      .catch((error) => {
        // An error has happened. Display the failure to the user here.
        // We utilize the HTML element we created.
        displayError(error);
      })
  );
}

function retrieveUpcomingInvoice(customerId, subscriptionId, newPriceId) {
  return fetch('/retrieve-upcoming-invoice', {
    method: 'post',
    headers: {
      'Content-type': 'application/json',
    },
    body: JSON.stringify({
      customerId: customerId,
      subscriptionId: subscriptionId,
      newPriceId: newPriceId,
    }),
  })
    .then((response) => {
      return response.json();
    })
    .then((invoice) => {
      return invoice;
    });
}

// function cancelSubscription() {
//   changeLoadingStatePrices(true);
//   const params = new URLSearchParams(document.location.search.substring(1));
//   const subscriptionId = params.get('subscriptionId');

//   return fetch('/cancel-subscription', {
//     method: 'post',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({
//       subscriptionId: subscriptionId,
//     }),
//   })
//     .then((response) => {
//       return response.json();
//     })
//     .then((cancelSubscriptionResponse) => {
//       return subscriptionCancelled(cancelSubscriptionResponse);
//     });
// }

function updateSubscription(priceId, subscriptionId) {
  return fetch('/update-subscription', {
    method: 'post',
    headers: {
      'Content-type': 'application/json',
    },
    body: JSON.stringify({
      subscriptionId: subscriptionId,
      newPriceId: priceId,
    }),
  })
    .then((response) => {
      return response.json();
    })
    .then((response) => {
      return response;
    });
}

// function retrieveCustomerPaymentMethod(paymentMethodId) {
//   return fetch('/retrieve-customer-payment-method', {
//     method: 'post',
//     headers: {
//       'Content-type': 'application/json',
//     },
//     body: JSON.stringify({
//       paymentMethodId: paymentMethodId,
//     }),
//   })
//     .then((response) => {
//       return response.json();
//     })
//     .then((response) => {
//       return response;
//     });
// }

function getConfig() {
  return fetch('/payment/config', {
    method: 'get',
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((response) => {
      return response.json();
    })
    .then((response) => {
      // Set up Stripe Elements
      stripeElements(response.publishableKey);
    });
}

getConfig();

/* ------ Sample helpers ------- */

function getFormattedAmount(amount) {
  // Format price details and detect zero decimal currencies
  var amount = amount;
  var numberFormat = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'symbol',
  });
  var parts = numberFormat.formatToParts(amount);
  var zeroDecimalCurrency = false;
  for (var part of parts) {
    if (part.type === 'decimal') {
      zeroDecimalCurrency = true;
    }
  }
  amount = zeroDecimalCurrency ? amount : amount / 100;
  var formattedAmount = numberFormat.format(amount);
  return formattedAmount;
}

// function capitalizeFirstLetter(string) {
//   let tempString = string.toLowerCase();
//   return tempString.charAt(0).toUpperCase() + tempString.slice(1);
// }

function getDateStringFromUnixTimestamp(date) {
  let nextPaymentAttemptDate = new Date(date * 1000);
  let day = nextPaymentAttemptDate.getDate();
  let month = nextPaymentAttemptDate.getMonth() + 1;
  let year = nextPaymentAttemptDate.getFullYear();

  return month + '/' + day + '/' + year;
}

// For demo purpose only
// function getCustomersPaymentMethod() {
//   let params = new URLSearchParams(document.location.search.substring(1));

//   let paymentMethodId = params.get('paymentMethodId');
//   if (paymentMethodId) {
//     retrieveCustomerPaymentMethod(paymentMethodId).then(function (response) {
//       document.getElementById('credit-card-last-four').innerText =
//         capitalizeFirstLetter(response.card.brand) +
//         ' •••• ' +
//         response.card.last4;

//       document.getElementById(
//         'subscribed-price'
//       ).innerText = capitalizeFirstLetter(params.get('priceId'));
//     });
//   }
// }

// getCustomersPaymentMethod();

// // Shows the cancellation response
// function subscriptionCancelled() {
//   document.querySelector('#subscription-cancelled').classList.remove('hidden');
//   document.querySelector('#subscription-settings').classList.add('hidden');
// }

function showSubscriptionCompleteModal(priceId) {
  const okBtn = document.getElementById('ok-btn');
  const successModal = document.getElementById('success-modal');
  function loginBtn() {
    window.location.href = '/login';
  }
  async function saveBasicBtn() {
    try {
      const customerId = document.getElementById('id').dataset.customerId;
      const response = await fetch('/payment/save-basic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customerId,
          plan: priceId,
        }),
      });
      if (response.ok) {
        document.getElementById('modal-header').innerText =
          'Basic plan confirmed!';
        document.getElementById('modal-text').innerText = 'Continue to log in.';
        okBtn.innerText = 'Log in';
        okBtn.addEventListener('click', loginBtn);
      }
    } catch (err) {
      console.log('err:', err);
    }
  }
  if (priceId.toLowerCase().includes('basic')) {
    document.getElementById('payment-form').classList.add('hidden');
    document.getElementById('modal-header').innerText =
      'You are about to subscribe to the Basic plan';
    document.getElementById('modal-text').innerText =
      'The basic plan is great, and free! You can always upgrade later.\n\nPremium plans include:\n・More storage space\n・Full resolution image uploads\n・Albums\n・Guest downloads';
    okBtn.innerText = 'Confirm Basic Plan';
    okBtn.addEventListener('click', saveBasicBtn);
  } else {
    okBtn.addEventListener('click', loginBtn);
  }
  document.getElementById('cancel-btn').addEventListener('click', () => {
    toggleSuccessModal(successModal);
  });
  toggleSuccessModal(successModal);
}

function toggleSuccessModal(successModal) {
  const modal = successModal.querySelector('#modal');
  successModal.classList.toggle('invisible');
  successModal.classList.toggle('opacity-0');
  modal.classList.toggle('invisible');
  modal.classList.toggle('opacity-0');
  modal.classList.toggle('-translate-y-2');
}

/* Shows a success / error message when the payment is complete */
function onSubscriptionSampleDemoComplete({
  priceId: priceId,
  subscription: subscription,
  paymentMethodId: paymentMethodId,
  invoice: invoice,
}) {
  let subscriptionId;
  let currentPeriodEnd;
  let customerId;
  if (subscription) {
    subscriptionId = subscription.id;
    currentPeriodEnd = subscription.current_period_end;
    if (typeof subscription.customer === 'object') {
      customerId = subscription.customer.id;
    } else {
      customerId = subscription.customer;
    }
  } else {
    const params = new URLSearchParams(document.location.search.substring(1));
    subscriptionId = invoice.subscription;
    currentPeriodEnd = params.get('currentPeriodEnd');
    customerId = invoice.customer;
  }

  window.location.href =
    '/account.html?subscriptionId=' +
    subscriptionId +
    '&priceId=' +
    priceId +
    '&currentPeriodEnd=' +
    currentPeriodEnd +
    '&customerId=' +
    customerId +
    '&paymentMethodId=' +
    paymentMethodId;
}

function demoChangePrice() {
  document.querySelector('#basic').classList.remove('border-pasha');
  document.querySelector('#premium').classList.remove('border-pasha');
  document.querySelector('#price-change-form').classList.add('hidden');

  // Grab the priceId from the URL
  // This is meant for the demo, replace with a cache or database.
  const params = new URLSearchParams(document.location.search.substring(1));
  const priceId = params.get('priceId').toLowerCase();

  // Show the change price screen
  document.querySelector('#prices-form').classList.remove('hidden');
  document
    .querySelector('#' + priceId.toLowerCase())
    .classList.add('border-pasha');

  let elements = document.querySelectorAll(
    '#submit-' + priceId + '-button-text'
  );
  for (let i = 0; i < elements.length; i++) {
    elements[0].childNodes[3].innerText = 'Current';
  }
  if (priceId === 'premium') {
    document.getElementById('submit-premium').disabled = true;
    document.getElementById('submit-basic').disabled = false;
  } else {
    document.getElementById('submit-premium').disabled = false;
    document.getElementById('submit-basic').disabled = true;
  }
}

// Changes the price selected
function changePriceSelection(priceId) {
  document.querySelector('#btn-basic').classList.remove('border-pasha');
  document.querySelector('#btn-premium').classList.remove('border-pasha');
  document.querySelector('#btn-premium-plus').classList.remove('border-pasha');
  document
    .querySelector(
      '#btn-' +
        priceId
          .replace('Mo', '')
          .replace('Yr', '')
          .replace('Plus', '-plus')
          .toLowerCase()
    )
    .classList.add('border-pasha');
}

// Show a spinner on subscription submission
function changeLoadingState(isLoading) {
  if (isLoading) {
    document.querySelector('#button-text').classList.add('hidden');
    document.querySelector('#loading').classList.remove('hidden');
    document.querySelector('#signup-form button').disabled = true;
  } else {
    document.querySelector('#button-text').classList.remove('hidden');
    document.querySelector('#loading').classList.add('hidden');
    document.querySelector('#signup-form button').disabled = false;
  }
}

// Show a spinner on subscription submission
function changeLoadingStatePrices(isLoading) {
  if (isLoading) {
    document.querySelector('#button-text').classList.add('hidden');
    document.querySelector('#loading').classList.remove('hidden');

    document.querySelector('#btn-basic').classList.add('invisible');
    document.querySelector('#btn-premium').classList.add('invisible');
    document.querySelector('#btn-premium-plus').classList.add('invisible');
    if (document.getElementById('confirm-price-change-cancel')) {
      document
        .getElementById('confirm-price-change-cancel')
        .classList.add('invisible');
    }
  } else {
    document.querySelector('#button-text').classList.remove('hidden');
    document.querySelector('#loading').classList.add('hidden');

    document.querySelector('#btn-basic').classList.remove('invisible');
    document.querySelector('#btn-premium').classList.remove('invisible');
    document.querySelector('#btn-premium-plus').classList.remove('invisible');
    if (document.getElementById('confirm-price-change-cancel')) {
      document
        .getElementById('confirm-price-change-cancel')
        .classList.remove('invisible');
      document
        .getElementById('confirm-price-change-submit')
        .classList.remove('invisible');
    }
  }
}

function clearCache() {
  localStorage.clear();
}
