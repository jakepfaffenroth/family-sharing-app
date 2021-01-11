const express = require('express');
const createError = require('http-errors');
const compression = require('compression');
const bodyParser = require('body-parser');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const logger = require('./config/winston');
// const logger = require('./config/pino');

const app = express();
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const flash = require('connect-flash');

const indexRouter = require('./indexRouter');
const userRouter = require('./users/userRouter');
const authRouter = require('./userAuth/authRouter');
const fileRouter = require('./fileHandler/fileRouter');
const albumRouter = require('./fileHandler/albumRouter');
const paymentRouter = require('./payments/paymentRouter');

// const pino = require('express-pino-logger')({
//   logger: logger,
//   autoLogging: false,
//   customLogLevel: function (res, err) {
//     if (res.statusCode >= 400 && res.statusCode < 500) {
//       return 'warn';
//     } else if (res.statusCode >= 500 || err) {
//       return 'error';
//     }
//     return 'info';
//   },
//   // Define a custom success message
//   customSuccessMessage: function (res) {
//     if (res.statusCode === 404) {
//       return 'resource not found';
//     }
//     return 'request completed';
//   },

//   // Define a custom error message
//   customErrorMessage: function (error, res) {
//     return 'request errored with status code: ' + res.statusCode;
//   },
// });
// // var pino = require('express-pino-logger')({ logger });
// app.use(pino);

app.use((req, res, next) => {
  function makeHttpLog(statusCode) {
    const statusColor =
      statusCode >= 200 && statusCode < 400
        ? '\033[38;2;149;196;121m'
        : '\033[38;2;255;97;136m';
    return `t ${req.method} ${req.url} ${statusColor}${res.statusCode}`;
  }
  // console.log('req:', req);
  // logger.info(makeHttpLog(res.statusCode));
  next();
});
app.use((req, res, next) => {
  if (req.originalUrl === '/payment/stripe-webhook') {
    bodyParser.raw({ type: '*/*' })(req, res, next);
  } else {
    bodyParser.json()(req, res, next);
  }
});
app.use(compression());
app.use(cors());
// Use JSON parser for all non-webhook routes

const ws = require('ws');
const wsConfig = {
  noServer: true,
};
const wsServer = new ws.Server(wsConfig);
wsServer.on('connection', (socket) => {
  app.locals.ws = socket;
  socket.on('message', async (message) => {
    msg(message);
    socket.send('pong');
  });
});

wsServer.on('close', (code, reason) => {
  info('connection closed.', code, reason);
});
wsServer.on('error', (err) => {
  error('websocket error: ', err);
});
app.use('/ws', (req, res) => {
  res.redirect(process.env.WSS);
});
const server = app.listen(3200);
server.on('upgrade', (request, socket, head) => {
  wsServer.handleUpgrade(request, socket, head, (socket) => {
    wsServer.emit('connection', socket, request);
  });
});

const db = require('./db').pgPromise;
const pgSession = require('connect-pg-simple')(session);

const sessionStore = new pgSession({
  pgPromise: db,
  pool: db.$pool, // Connection pool
  tableName: 'user_sessions', // Sessions table
});

app.use(
  session({
    secret: 'gus',
    store: sessionStore,
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: true,
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

passport.serializeUser(function (owner, done) {
  done(null, owner);
});

passport.deserializeUser(async function (owner, done) {
  try {
    const foundOwner = await db.one(
      'SELECT * FROM owners WHERE owner_id = $1',
      [owner.ownerId]
    );
    done(foundOwner);
  } catch (err) {
    done(err);
  }
});

// view engine setup
const exphbs = require('express-handlebars');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine(
  'html',
  exphbs({
    extname: '.html',
  })
);

app.use(
  morgan(
    (tokens, req, res) => {
      const makeHttpLog = (statusCode) => {
        const statusColor =
          statusCode >= 200 && statusCode < 400
            ? '\033[38;2;149;196;121m'
            : '\033[38;2;255;97;136m';
        return `${statusColor}${statusCode}${'\033[39m'}`;
      };
      return [
        '\u001b[38;5;247m' + tokens.method(req, res),
        tokens.url(req, res),
        makeHttpLog(tokens.status(req, res)),
        tokens['response-time'](req, res) + ' ms',
      ].join(' ');
    },
    { stream: logger.stream }
  )
);
app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '50mb' }));
app.use(
  express.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 })
);

//add routes
app.use(
  '/',
  // (req, res, next) => {
  //   pino(req, res)
  //   // logger.info(`${req.method}`);
  //   req.log.info();
  //   next();
  // },
  indexRouter
);
app.use('/user', userRouter);
app.use('/auth', authRouter);
app.use('/files', fileRouter);
app.use('/albums', albumRouter);
app.use('/payment', paymentRouter);

const { UI } = require('bull-board');
const { info } = require('console');
app.use('/admin/bull', UI);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  logger.error(
    `${err.status || 500} - ${err.message} - ${req.originalUrl} - ${
      req.method
    } - ${req.ip}`
  );

  // render the error page
  res
    .status(err.status || 500)
    .json({ msg: err.message, status: err.status, stack: err.stack });
});

module.exports = app;
