const logger = require('./winston');
// const logger = require('./pino')

let path;
process.env.DEBUG_HIDE_DATE = 'true';

if (process.env.NODE_ENV === 'production') {
  path = './bin/.env.production';
  process.env.DEBUG = `${process.env.DEBUG},✘`;
  // global.success = null;
  // global.error = null;
  // global.info = null;
} else {
  path = './bin/.env.development';
  process.env.DEBUG = `${process.env.DEBUG},.`;
}

require('dotenv').config({ path });
global.verbose = logger.verbose;
global.debug = logger.debug;
global.info = logger.info;
global.msg = logger.msg;
global.success = logger.success;
// global.warn = errLogger.warn
// global.warn = errLogger.warn
global.warn = logger.warn;
global.error = logger.error;

// global.info = devLogs.info
// global.msg = devLogs.msg
// global.success = devLogs.success
// global.warn = devLogs.warn
// global.error = devLogs.error

// global.success = require('debug')('✓');
// global.error = require('debug')('✘');
// global.info = require('debug')('i');
// global.msg = require('debug')('@');
// console.log = require('debug')('log');
// success.color = 76;
// error.color = 1;
// info.color = 33;
// msg.color = 171;
// console.log.color = 214;
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
