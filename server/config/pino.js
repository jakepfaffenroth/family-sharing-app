process.env.LOG_LEVEL = 'debug';

const pino = require('pino')(
  {
    level: process.env.LOG_LEVEL || 'info',
    // customLevels: {
    //   http: 34,
    //   success: 35,
    // },
    formatters: {
      level(label, number) {
        return { level: label };
      },
    },
    // formatters: {
    //   log(object) {
    //     // console.log('object:', object);
    //     return object;
    //   },
    // },
    prettyPrint:
      process.env.NODE_ENV === 'production'
        ? false
        : {
            colorize: true,
          levelFirst: true,
            ignore: 'hostname'
          },
  },
  process.stderr
);
pino.info('test info')
// pino.success('success');
// pino.info('hello world');
// pino.error('this is at error level');
// pino.info('the answer is %d', 42);
// pino.info({ obj: 42 }, 'hello world');
// pino.info({ obj: 42, b: 2 }, 'hello world');
// pino.info({ nested: { obj: 42 } }, 'nested');
// setImmediate(function () {
//   pino.info('after setImmediate');
// });
// pino.error(new Error('an error'));

// var child = pino.child({ a: 'property' });
// child.info('hello child!');

// var childsChild = child.child({ another: 'property' });
// childsChild.info('hello baby..');

// pino.debug('this should be mute');

// pino.level = 'trace';

// pino.debug('this is a debug statement');

// pino
//   .child({ another: 'property' })
//   .debug('this is a debug statement via child');
// pino.trace('this is a trace statement');

// pino.debug('this is a "debug" statement with "');

// const child = pino.child({ a: 'property' });
// child.info('hello child!');

module.exports = pino;
