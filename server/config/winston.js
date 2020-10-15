const { info } = require('autoprefixer');
const winston = require('winston');
require('winston-daily-rotate-file');
const { createLogger, transports, format } = winston;
const {
  combine,
  timestamp,
  label,
  printf,
  colorize,
  uncolorize,
  align,
  ms,
  splat,
  errors,
} = format;

const defaultColors = {
  debug: 'gray whiteBG inverse',
  info: 'blue',
  success: 'green',
  http: 'white',
  msg: 'magenta bold',
  warn: 'yellow bold',
  error: 'red bold inverse',
};

const customColors = {
  default: '\u001b[39m',
  verbose: '\u001b[38;5;255m',
  http: '\u001b[38;5;247m',
  // debug: '\u001b[38;5;87m',
  info: '\u001b[38;5;39m',
  msg: '\u001b[38;5;171m',
  success: '\u001b[38;5;76m',
};

winston.addColors(defaultColors);

const uppercaseFormat = printf((info) => {
  info.level = info.level.toUpperCase();
});

const logFormat = printf((info) => {
  function makeCustom(type, part, ms) {
    // let symbol;
    let content;
    if (part === 'level') {
      switch (type) {
        case 'verbose':
          content = '▹'
          break
        case 'http':
          content = '▹';
          break;
        case 'info':
          content = 'i';
          break;
        case 'msg':
          content = '@';
          break;  
        case 'success':
          content = '✓';
          break;
        default:
          content = type.toUpperCase();
          break;
      }
    } else if (part === 'ms') {
      content = ms;
    }
    return customColors[type] + content + customColors.default;
  }
  const level = info.level.toLowerCase();
  if (level.includes('verbose')) {
    info.level = makeCustom('verbose', 'level');
    info.ms = makeCustom('verbose', 'ms', info.ms);
  }
  if (level.includes('http')) {
    info.level = makeCustom('http', 'level');
    info.ms = makeCustom('http', 'ms', info.ms);
  }
  if (level.includes('info')) {
    info.level = makeCustom('info', 'level');
    info.ms = makeCustom('info', 'ms', info.ms);
  }
  if (level.includes('msg')) {
    info.level = makeCustom('msg', 'level');
    info.ms = makeCustom('msg', 'ms', info.ms);
  }
  if (level.includes('success')) {
    info.level = makeCustom('success', 'level');
    info.ms = makeCustom('success', 'ms', info.ms);
  }
  // if (info.level.includes('warn') || info.level.includes('error')) {
  //   info.level = info.level
  //     .replace('warn', ' warn ')
  //     .replace('error', ' ERROR ');
  // }
  return `${info.level + ' '}${info.message} ${info.ms}`;
});

const consoleTransporter = new transports.Console({
  format: combine(
    uppercaseFormat,
    colorize({ all: false }),
    logFormat
    // printf((info) => {
    //   // info.level = info.level.toUpperCase();
    //   return `${info.level} ${info.message} ${info.ms}`;
    // })
  ),
  level: 'verbose',
  handleExceptions: false,
});
const fileTransporter = new transports.DailyRotateFile({
  level: 'warn',
  format: format.combine(format.json()),
  filename: 'app-%DATE%.log',
  dirname: './logs/app/',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: false,
  maxSize: '5m',
  maxFiles: '10d',
});

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'verbose',
  levels: { ...winston.config.npm.levels, success: 2, msg: 3 },
  transports: [consoleTransporter, fileTransporter],
  format: combine(
    // format.padLevels(),
    // align(),
    // format.label({ label: path.basename(require.main.filename) }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    // format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'label'] }),
    ms(),
    splat(),
    errors({ stack: true })
    // format.json(),
    // format.colorize({ all: false }),
    // logFormat
    // format.simple()
  ),
  exceptionHandlers: [consoleTransporter, fileTransporter],
  exitOnError: false, // do not exit on handled exceptions
  // levels: levels,
  // silent: process.env.NODE_ENV === 'production' ? true : false,
});

// create a stream object with a 'write' function that will be used by `morgan`
logger.stream = {
  write: function (message, encoding) {
    message = message
      .replace('\u001b[39m', '\u001b[38;5;247m')
      .replace('\n', '');
    // console.log('message:', JSON.stringify(message));

    logger.http(message);
  },
};
// try {
//   let err = { errCode: 404, errMsg: 'Testing err' };
//   throw new Error(JSON.stringify(err))
// } catch (err) {
//   logger.error(err)
// }

logger.on('error', (err) => {
  console.log('Logging error:', err);
});

// logger.info('Info');
// logger.debug('Debug');
// logger.verbose('A verbose log')
// logger.error('Error)

module.exports = logger;
