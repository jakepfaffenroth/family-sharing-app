const createError = require('http-errors');
const express = require('express');
const path = require('path');
const dotenv = require('dotenv').config({ path: path.join(__dirname, '.env') });
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const logger = require('morgan');
const monitoro = require('monitoro');

const cors = require('cors');
const axios = require('axios');
const passport = require('passport');
const session = require('express-session');

const indexRouter = require('./indexRouter');
const userRouter = require('./users/userRouter');
const guestRouter = require('./users/guestRouter');
const authRouter = require('./userAuth/authRouter');
const fileRouter = require('./fileServer/fileRouter');

const app = express();
app.use(cors());

const ws = require('ws');
// Set up a headless websocket server that prints any
// events that come in.
const wsConfig = {
  noServer: true,
  // path: '/files/upload',
  // server: app,
};

const wsServer = new ws.Server(wsConfig);
wsServer.on('connection', (socket) => {
  // socket.on('message', (message) => {
  //   // console.log(`Received message => ${message.length < 100 ? message : '(long message)'}`);
  //   if (message === 'Upload complete') socket.send(Buffer.from(JSON.stringify({ type: 'allFinished' })));
  // });
  socket.send('ho!');
  app.locals.ws = socket;
});

wsServer.on('close', (code, reason) => {
  console.log('connection closed.', code, reason);
});
const server = app.listen(3200);
// const server = async () => {
//   try {
//     return app.listen(3200);
//   } catch (err) {
//     if (err.code === 'EADDRINUSE') {
//       const kill = require('kill-port');
//       await kill(3200, 'tcp').then(console.log).catch(console.log);
//       return app.listen(3200);
//     }
//   }
// };
server.on('upgrade', (request, socket, head) => {
  wsServer.handleUpgrade(request, socket, head, (socket) => {
    wsServer.emit('connection', socket, request);
  });
});

// OLD TUS STUFF
// const tus = require('tus-node-server');
// const server = new tus.Server();
// const bufferStore = require('./fileServer/BufferStore.js');
// server.datastore = new bufferStore({
//   path: '/files',
// });
// server.get('/', (req, res) => {
//   console.log(req);
// });

// const uploadApp = express();
// uploadApp.all('*', server.handle.bind(server));
// app.use('/uploads', uploadApp, (req, res) => {
//   console.log('test', typeof res.locals.file);
//   res.status(201).set('Location', null).end();
// });

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

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(async function (user, done) {
  try {
    const foundUser = await db.one('SELECT * FROM users WHERE user_id = $1', [user.userId]);
    done(foundUser);
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
app.use(express.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));

//add routes
app.use('/', indexRouter);
app.use('/user', userRouter);
app.use('/auth', authRouter);
app.use('/files', fileRouter);
app.use('/guest', guestRouter);

const multer = require('multer');
const storage = multer.memoryStorage();
const tasks = require('./tasks/imgCompressor');
// app.use('/tasks', multer({ storage: storage }).any(), tasks.add);

const { UI } = require('bull-board');
app.use('/admin/bull', UI);
// const Arena = require('bull-arena');
// const Bull = require('bull');
// const arena = Arena(
//   {
//     Bull,
//     queues: [
//       {
//         name: 'imgCompressor',
//         hostId: 'Carousel',
//         redis: {
//           port: 6379,
//           host: 'localhost',
//           password: process.env.REDIS_AUTH,
//         },
//       },
//     ],
//   },
//   {
//     // Make the arena dashboard become available at {my-site.com}/arena.
//     basePath: '/arena',

//     // Let express handle the listening.
//     disableListen: true,
//   }
// );
// app.use('/admin', arena);
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500).json({ msg: err.message, status: err.status, stack: err.stack });
});

module.exports = app;
