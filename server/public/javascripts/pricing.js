const priceToggle = () => {
  // Don't run the pricing page logic if not on the pricing page
  if (
    window.location.pathname != '/pricing' &&
    window.location.pathname != '/complete-signup'
  ) {
    return;
  }

  const toggleCheckbox = document.getElementById('toggle-checkbox');
  const toggleComponent = document.getElementById('toggle-component');
  const toggleCircle = document.getElementById('toggle-circle');
  const premiumPrice = document.getElementById('premium-price');
  const premiumLabel = document.getElementById(
    'premium-monthly-or-annual-label'
  );
  const plusPrice = document.getElementById('plus-price');
  const plusLabel = document.getElementById('plus-monthly-or-annual-label');
  toggleComponent ? toggleComponent.addEventListener('click', toggle) : null;

  toggleCheckbox.checked = true;
  updatePrice();

  function toggle() {
    toggleCheckbox.checked = !toggleCheckbox.checked;
    const translate = toggleCheckbox.checked ? '2rem' : '0rem';

    toggleCircle.style.transform = `translateX(${translate})`;
    updatePrice();
  }

  function updatePrice() {
    if (toggleCheckbox.checked) {
      premiumPrice.innerText = '5';
      premiumLabel.innerText = '/ month';
      plusPrice.innerText = '10';
      plusLabel.innerText = '/ month';
    } else {
      premiumPrice.innerText = '45';
      premiumLabel.innerText = '/ year - save 25%';
      plusPrice.innerText = '95';
      plusLabel.innerText = '/ year - save 20%';
    }
  }
};

export { priceToggle };
