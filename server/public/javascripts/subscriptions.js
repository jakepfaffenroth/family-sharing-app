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
});

function openConfirmationModal(plan) {
  createModalContent(plan);
  openModal();
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

  const modalWrapper = document.getElementById('modal-wrapper');
  const cancelBtn = document.getElementById('cancel-btn');
  modalWrapper.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);

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
    modalWrapper.removeEventListener('click', closeModal);
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

    okBtn.removeEventListener('click', saveBasicSubscription);
    this.plan = plan;
    okBtn.addEventListener('click', checkout.bind(this));
  }

  p3.classList.add('mt-2', 'font-semibold');
  text.append(p1, p2, ul, p3);
  okBtn.innerText = 'Continue';
}

async function saveBasicSubscription() {
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
  const plan = this.plan;
  const ownerId = getCookie('ownerId');

  fetch('/payment/create-checkout-session', {
    method: 'POST',
    body: JSON.stringify({ plan, ownerId, source: 'server', type: 'new' }),
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
  const modalWrapper = document.getElementById('modal-wrapper');
  const modalBox = document.getElementById('modal-box');

  modalWrapper.classList.toggle('invisible');
  modalWrapper.classList.toggle('opacity-0');
  modalBox.classList.toggle('invisible');
  modalBox.classList.toggle('opacity-0');
  modalBox.classList.toggle('-translate-y-2');
}

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
