let stripe = Stripe(
  'pk_test_51HYjdCCto9koSaMfB1vfa2yKqEHrKbyEg0CHfL31Xck4Kom1QgvYSYhEy0G27aSwa2Ydy3RSmX9YxDFvdVNEIHz40032As5FXu'
); // Publishable Key

const server = document.getElementById('hiddenData').dataset.server;

const btns = {
  basic: document.getElementById('btn-basic'),
  premiumMo: document.getElementById('btn-premiumMo'),
  premiumYr: document.getElementById('btn-premiumYr'),
};

Object.keys(btns).forEach((key) => {
  btns[key].addEventListener('click', () =>
    openConfirmationModal(btns[key].value)
  );
  // if (btns[key].value.includes('basic')) {
  //   btns[key].addEventListener('click', (e) => {
  //     e.stopPropagation();
  //     openBasicSubscriptionModal(btns[key].value);
  //   });
  // } else {
  //   btns[key].addEventListener('click', () =>
  //     // openPaymentModal(btns[key].value)
  //     checkout(btns[key].value)
  //   );
  // }
});

function openConfirmationModal(plan) {
  createModalContent(plan);
  openModal();
  // const modalWrapper = document.getElementById('modal-wrapper');
}

function createModalContent(plan, success) {
  const header = document.getElementById('modal-header');
  const text = document.getElementById('modal-text');
  const okBtn = document
    .getElementById('modal-footer')
    .querySelector('#ok-btn');

  // clear content before appending to avoid duplication in case user closes and reopens the modal
  removeAllChildNodes(header);
  removeAllChildNodes(text);
  removeAllChildNodes(okBtn);

  header.innerText = capitalizeFirstLetter(plan) + ' Plan';

  const p1 = document.createElement('p');
  const p2 = document.createElement('p');
  const ul = document.createElement('ul');
  const p3 = document.createElement('p');
  if (success && plan === 'basic') {
    header.innerText = 'Welcome!';

    const p = document.createElement('p');
    p.innerText = 'Continue to log in';
    text.append(p);

    document.getElementById('cancel-btn').classList.add('hidden');

    okBtn.innerText = 'Log in';
    okBtn.removeEventListener('click', saveBasicSubscription);
    okBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      redirectToLogin();
    });
    return;
  } else if (plan === 'basic') {
    p1.innerText =
      'The basic plan is great, and free! You can always upgrade later.';
    p2.innerText = 'Premium includes:';
    p2.classList.add('mt-2');
    const liArr = [
      '・Storage for 2500 photos',
      '・Full resolution image uploads',
      '・Albums',
      '・Guest downloads',
    ];
    for (const x of liArr) {
      let li = document.createElement('li');
      li.innerText = x;
      ul.appendChild(li);
    }
    p3.innerText = 'Do you want the Basic plan?';
    okBtn.addEventListener('click', saveBasicSubscription);
  } else if (plan.includes('premium')) {
    p1.innerText = 'Carousel Premium includes';
    // p2.innerText = 'Premium includes:';
    // p2.classList.add('mt-2');
    const liArr = [
      '・Storage for 2500 photos',
      '・Full resolution image uploads',
      '・Albums',
      '・Guest downloads',
    ];
    for (const x of liArr) {
      let li = document.createElement('li');
      li.innerText = x;
      ul.appendChild(li);
    }
    // p3.innerText = 'Proceed to checkout';

    okBtn.removeEventListener('click', saveBasicSubscription);
    this.plan = plan;
    okBtn.addEventListener('click', checkout.bind(this));
  }

  p3.classList.add('mt-2', 'font-semibold');

  text.append(p1, p2, ul, p3);

  okBtn.innerText = 'Continue';

  const modalWrapper = document.getElementById('modal-wrapper');
  const cancelBtn = document.getElementById('cancel-btn');
  // modalWrapper.removeEventListener('click', closeModal);

  modalWrapper.addEventListener('click', closeModal);
  // cancelBtn.removeEventListener('click', closeModal);

  cancelBtn.addEventListener('click', closeModal);
}

async function saveBasicSubscription() {
  // const basicModal = document.getElementById('basic-modal');
  // const successModal = document.getElementById('success-modal');
  // console.log('successModal 1:', successModal);
  // const okBtn = successModal.querySelector('#ok-btn');
  // console.log('successModal 2:', successModal);
  try {
    const customerId = getCookie('customerId');
    const response = await fetch('/payment/save-basic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId,
        plan: 'basic',
      }),
    });
    if (response.ok) {
      closeModal();
      createModalContent('basic', 'success');
      openModal();
      return;
      // successModal.querySelector('#modal-header').innerText =
      //   'Basic plan confirmed!';
      // successModal.querySelector('#modal-text').innerText =
      //   'Continue to log in.';
      // // Make sure btn says 'Log in'
      // removeAllChildNodes(okBtn);
      // okBtn.innerText = 'Log in';
      // okBtn.addEventListener('click', redirectToLogin);
      // console.log('basicModal:', basicModal);
      // console.log('successModal:', successModal);
      // closeModal(basicModal);
      // openModal(successModal);
    }
  } catch (err) {
    console.error('err:', err);
    const basicModalText = document.getElementById('modal-text');
    removeAllChildNodes(basicModalText);
    basicModalText.innerText =
      'An error occurred. Please refresh the page and try again.';
  }
}

function checkout() {
  const plan = this.plan
  const ownerId = getCookie('ownerId');

  fetch('/payment/create-checkout-session', {
    method: 'POST',
    body: JSON.stringify({ plan, ownerId }),
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(function (response) {
      return response.json();
    })
    .then(function (session) {
      return stripe.redirectToCheckout({
        sessionId: session.id,
      });
    })
    .then(function (result) {
      if (result.error) {
        alert(result.error.message);
      }
    })
    .catch(function (err) {
      console.error(err);
    });
}

function toggleModal(e) {
  // if (e) e.stopPropagation();

  const modalWrapper = document.getElementById('modal-wrapper');
  const modalBox = document.getElementById('modal-box');

  modalWrapper.classList.toggle('invisible');
  modalWrapper.classList.toggle('opacity-0');
  modalBox.classList.toggle('invisible');
  modalBox.classList.toggle('opacity-0');
  modalBox.classList.toggle('-translate-y-2');
}

// function stripeElements() {
//   // Create card element
//   if (document.getElementById('card-element')) {
//     const elements = stripe.elements();

//     const style = {
//       base: {
//         color: '#374152',
//         fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
//         fontSmoothing: 'antialiased',
//         fontSize: '16px',
//         '::placeholder': {
//           color: '#afb3bb',
//         },
//       },
//       invalid: {
//         color: '#fa755a',
//         iconColor: '#fa755a',
//       },
//     };

//     const classes = {
//       base:
//         'rounded-md relative px-3 py-2 border border-gray-400 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue focus:border-blue-300 focus:z-10 sm:text-sm sm:leading-5',
//     };

//     let card = elements.create('card', {
//       style,
//       classes,
//     });
//     card.mount('#card-element');

//     // changeLoadingState(true);

//     card.on('focus', function () {
//       let el = document.getElementById('card-element-errors');
//       el.classList.add('focused');
//     });

//     card.on('blur', function () {
//       let el = document.getElementById('card-element-errors');
//       el.classList.remove('focused');
//     });

//     card.on('change', function (event) {
//       displayError(event);
//     });
//   } else {
//     console.error('no card-element');
//   }

//   let paymentModal = document.getElementById('payment-form');
//   if (paymentModal) {
//     paymentModal.addEventListener('submit', function (e) {
//       e.preventDefault();
//       // changeLoadingStatePrices(true);

//       // If a previous payment was attempted, get the lastest invoice
//       const latestInvoicePaymentIntentStatus = localStorage.getItem(
//         'latestInvoicePaymentIntentStatus'
//       );

//       if (latestInvoicePaymentIntentStatus === 'requires_payment_method') {
//         const invoiceId = localStorage.getItem('latestInvoiceId');
//         const isPaymentRetry = true;
//         // create new payment method & retry payment on invoice with new payment method
//         createPaymentMethod({
//           card,
//           isPaymentRetry,
//           invoiceId,
//         });
//       } else {
//         // create new payment method & create subscription
//         createPaymentMethod({ card });
//       }
//     });
//   }
// }

// function openBasicSubscriptionModal(priceId) {
//   const basicModal = document.getElementById('basic-modal');
//   createBasicModalContent(basicModal);
//   // document.getElementById('modal-header').classList.add('text-teal-600');

//   basicModal
//     .querySelector('#ok-btn')
//     .addEventListener('click', () => saveBasicBtn(priceId));

//   basicModal
//     .querySelector('#cancel-btn')
//     .addEventListener('click', () => closeModal(basicModal));

//   openModal(basicModal);
// }

// function openPaymentModal(plan, subscriptionTerm) {
//   createPaymentModalContent(plan);
//   // Show the payment form
//   const paymentModal = document.querySelector('#payment-modal');

//   paymentModal
//     .querySelector('#ok-btn')
//     .addEventListener('click', () => alert('Save payment'));

//   paymentModal
//     .querySelector('#cancel-btn')
//     .addEventListener('click', () => closeModal(paymentModal));

//   openModal(paymentModal);

//   // updatePlan(plan, subscriptionTerm);
// }

// function createPaymentMethod({ card, isPaymentRetry, invoiceId }) {
//   const params = new URLSearchParams(document.location.search.substring(1));
//   const customerId = params.get('customerId');
//   // Set up payment method for recurring usage
//   let billingName = document.querySelector('#name').value;

//   let priceId = document
//     .getElementById('priceId')
//     .innerHTML // +
//     // '_' +
//     // subscriptionTerm
//     .toUpperCase();

//   stripe
//     .createPaymentMethod({
//       type: 'card',
//       card: card,
//       billing_details: {
//         name: billingName,
//       },
//     })
//     .then((result) => {
//       if (result.error) {
//         displayError(result);
//       } else {
//         if (isPaymentRetry) {
//           // Update the payment method and retry invoice payment
//           retryInvoiceWithNewPaymentMethod({
//             customerId: customerId,
//             paymentMethodId: result.paymentMethod.id,
//             invoiceId: invoiceId,
//             priceId: priceId,
//           });
//         } else {
//           changeLoadingState(false);
//           // Create the subscription
//           createSubscription({
//             customerId: customerId,
//             paymentMethodId: result.paymentMethod.id,
//             priceId: priceId,
//           });
//         }
//       }
//     });
// }

// function changeLoadingState(isLoading) {
//   const modal = document.getElementById('payment-modal');
//   const btnText = modal.querySelector('#button-text');
//   if (isLoading) {
//     btnText.innerText = 'Subscribing...';
//     // document.querySelector('#button-text').classList.add('hidden');
//     // document.querySelector('#loading').classList.remove('hidden');
//     document.querySelector('#signup-form button').disabled = true;
//   } else {
//     btnText.innerText = 'Subscribe';
//     // document.querySelector('#button-text').classList.remove('hidden');
//     // document.querySelector('#loading').classList.add('hidden');
//     document.querySelector('#signup-form button').disabled = false;
//   }
// }

// function createBasicModalContent(basicModal) {
//   const header = basicModal.querySelector('#modal-header');
//   const text = basicModal.querySelector('#modal-text');
//   const okBtn = basicModal.querySelector('#button-text');

//   // clear content before appending to avoid duplication in case user closes and reopens the modal
//   removeAllChildNodes(header);
//   removeAllChildNodes(text);
//   removeAllChildNodes(okBtn);

//   header.innerText = 'Basic Plan';

//   const p1 = document.createElement('p');
//   const p2 = document.createElement('p');
//   const ul = document.createElement('ul');
//   const p3 = document.createElement('p');

//   p1.innerText =
//     'The basic plan is great, and free! You can always upgrade later.';
//   p2.innerText = 'Premium includes:';
//   p2.classList.add('mt-2');
//   const liArr = [
//     '・More storage space',
//     '・Full resolution image uploads',
//     '・Albums',
//     '・Guest downloads',
//   ];
//   for (const x of liArr) {
//     let li = document.createElement('li');
//     li.innerText = x;
//     ul.appendChild(li);
//   }
//   p3.innerText = 'Do you want the Basic plan?';
//   p3.classList.add('mt-2', 'font-semibold');

//   text.append(p1, p2, ul, p3);

//   okBtn.innerText = 'Confirm';

//   const modalWrapper = basicModal.querySelector('#modal-wrapper');
//   const cancelBtn = basicModal.querySelector('#cancel-btn');
//   modalWrapper.addEventListener('click', (e) =>
//     closeModal(e.target.parentElement)
//   );
//   cancelBtn.addEventListener('click', (e) =>
//     closeModal(e.target.parentElement)
//   );
// }

// async function createPaymentModalContent(plan) {
//   const terms = {
//     premiumMo: '(monthly)',
//     premiumYr: '(yearly)',
//   };
//   const prices = await stripe.prices.list({
//     active: true,
//     expand: ['product'],
//   });

//   console.log('prices:', prices);
//   const paymentModal = document.getElementById('payment-modal');
//   const header = paymentModal.querySelector('#modal-header');
//   const text = paymentModal.querySelector('#modal-text');
//   const okBtn = paymentModal.querySelector('#button-text');

//   // clear content before appending to avoid duplication in case user closes and reopens the modal
//   removeAllChildNodes(header);
//   removeAllChildNodes(text);

//   header.innerText = 'Carousel Premium';

//   const subscriptionP = document.createElement('p');
//   const priceP = document.createElement('p');
//   const p3 = document.createElement('p');

//   subscriptionP.innerText = 'Subscribe to Premium ' + terms[plan];
//   priceP.innerText = '';
//   p3.innerText = '→ Total due now';
// }

function openModal() {
  const modalWrapper = document.getElementById('modal-wrapper');
  const modalBox = document.getElementById('modal-box');

  modalWrapper.classList.remove('invisible');
  modalWrapper.classList.remove('opacity-0');
  modalBox.classList.remove('invisible');
  modalBox.classList.remove('opacity-0');
  modalBox.classList.remove('-translate-y-2');
}

function closeModal(e) {
  if (e) e.stopPropagation();

  const modalWrapper = document.getElementById('modal-wrapper');
  const modalBox = document.getElementById('modal-box');

  modalWrapper.classList.add('invisible');
  modalWrapper.classList.add('opacity-0');
  modalBox.classList.add('invisible');
  modalBox.classList.add('opacity-0');
  modalBox.classList.add('-translate-y-2');
}

function redirectToLogin() {
  window.location.href = '/login';
}

function getCookie(cookieName) {
  const cookieArr = document.cookie.split(';');

  // Loop through the array elements
  for (let i = 0; i < cookieArr.length; i++) {
    const cookiePair = cookieArr[i].split('=');
    console.log('cookiePair[0].trim():', cookiePair[0].trim());
    // Removing whitespace at the beginning of the cookie name and compare it with the given string
    if (cookieName == cookiePair[0].trim()) {
      // Decode the cookie value and return
      return decodeURIComponent(cookiePair[1]);
    }
  }
}

function removeAllChildNodes(parent) {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
}

function capitalizeFirstLetter(str) {
  const firstLetter = str[0].toUpperCase();
  const restOfStr = str.split('').splice(1).join('');
  return firstLetter + restOfStr;
}
