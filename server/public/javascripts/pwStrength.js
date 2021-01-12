const bars = document.getElementById('strength-bar').children;
const pwInput = document.getElementById('pw-input');

const pwTips = document.getElementById('pw-tips');
pwInput.addEventListener('input', (e) => checkPw(e.target.value));

const submitBtn = document.getElementById('submit-btn');
submitBtn.addEventListener('click', (e) => saveFormData(e));

function checkPw(input) {
  if (!input) {
    pwTips.innerText = '';
    Object.keys(bars).forEach((key, index) => {
      changeBarStyle(parseInt(key), 'bg-transparent');
    });
    return;
  }
  let result = zxcvbn(input);

  let suggs = '';
  if (result.feedback.suggestions) {
    result.feedback.suggestions.forEach((sugg) => {
      suggs = suggs.concat(sugg + ' ');
    });

    pwTips.innerText = `${suggs}${'\n' + result.feedback.warning || ''}`;
  } else pwTips.innerText = '';

  switch (result.score) {
    case 0:
      changeBarStyle(0, 'bg-red-500 border-red-500');
      // changeBarStyle(0, 'bg-red-500 w-1/12');
      break;
    case 1:
      changeBarStyle(1, 'bg-red-500 border-red-500');
      // changeBarStyle(1, 'bg-red-500 w-1/5');
      break;
    case 2:
      changeBarStyle(2, 'bg-orange-400 border-orange-400');
      // changeBarStyle(2, 'bg-orange-400 w-2/5');
      break;
    case 3:
      changeBarStyle(3, 'bg-yellow-300 border-yellow-300');
      // changeBarStyle(3, 'bg-yellow-300 w-3/4');
      break;
    case 4:
      changeBarStyle(4, 'bg-green-400 border-green-400');
      // changeBarStyle(4, 'bg-green-400 w-full');
      break;
    default:
      break;
  }
}

function changeBarStyle(barIndex, color) {
  const baseStyle =
    'w-1/5 border rounded-sm left-0 h-2 transition-all duration-300 ease-out';
  if (barIndex < bars.length - 1) {
    bars[barIndex + 1].setAttribute('class', ` ${baseStyle} bg-transparent `);
  }
  bars[barIndex].setAttribute('class', ` ${baseStyle} ${color}`);
}

function saveFormData(e) {
  // console.log('e.target:', e.target);
}
