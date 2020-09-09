const express = require('express');
const createError = require('http-errors');
const compression = require('compression');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const cors = require('cors');
const passport = require('passport');
const session = require('express-session');

const indexRouter = require('./indexRouter');
const userRouter = require('./users/userRouter');
const authRouter = require('./userAuth/authRouter');
const fileRouter = require('./fileHandler/fileRouter');

const app = express();
app.use(compression());
app.use(cors());

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
  res.redirect('wss://localhost:3200');
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
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({ limit: '50mb' }));
app.use(
  express.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 })
);

//add routes
app.use('/', indexRouter);
app.use('/user', userRouter);
app.use('/auth', authRouter);
app.use('/files', fileRouter);

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

  // render the error page
  res
    .status(err.status || 500)
    .json({ msg: err.message, status: err.status, stack: err.stack });
});

module.exports = app;
