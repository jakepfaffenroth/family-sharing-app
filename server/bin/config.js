let path;
process.env.DEBUG_HIDE_DATE = true;

if (process.env.NODE_ENV === 'production') {
  path = './bin/.env.production';
  process.env.DEBUG = `${process.env.DEBUG},✘`;
  // global.success = null;
  // global.error = null;
  console.log(process.env.DEBUG);
  // global.info = null;
} else {
  path = './bin/.env.development';
  process.env.DEBUG = '.';
}

require('dotenv').config({ path });

// if (process.env.DEBUG) {
global.success = require('debug')('✓');
global.error = require('debug')('✘');
global.info = require('debug')('i');
global.msg = require('debug')('@');
console.log = require('debug')('▹');

success.color = 76;
error.color = 1;
info.color = 33;
msg.color = 171;
console.log.color = 214;
// }
// success('success');
// error('error');
// info('info');
// msg('message received');
// console.log('console.log');

// require('debug').colors.forEach(index => {
//   info.color=index
//   info(index)
// })
