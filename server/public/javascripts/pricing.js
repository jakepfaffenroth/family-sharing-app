const priceBtns = document.getElementsByClassName('priceBtn');
for (const btn of priceBtns) {
  btn.addEventListener('click', () => {
    window.location.href = '/signup';
  });
}
console.log('priceBtns:', priceBtns);
