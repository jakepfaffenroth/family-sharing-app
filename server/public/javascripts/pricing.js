// const headerLabels = ['', 'Basic', 'Premium'];
// const headerCol = [
//   'Upload limit',
//   'Image quality',
//   'Albums',
//   'Guest downloads',
//   'Print ordering',
//   'Private sharing',
// ];
// const details = [
//   ['500', '5000'],
//   ['Compressed & resized', 'Original'],
//   ['', 'Unlimited'],
//   ['', 'coming soom'],
//   ['coming soon', 'coming soom'],
//   ['', ''],
// ];

// const table = document.getElementById('comparison-table');
// const header = document.createElement('TR');
// headerLabels.forEach((x) => {
//   // header.append((document.createElement('TH').innerText = x));
//   // table.append(header);
// });

const priceBtns = document.getElementsByClassName('priceBtn');
for (const btn of priceBtns) {
  btn.addEventListener('click', () => {
    window.location.href = '/signup';
  });
}
console.log('priceBtns:', priceBtns);
