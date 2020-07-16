const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const logger = require('morgan');

const cors = require('cors');
const axios = require('axios');
const mongoose = require('mongoose');
const passport = require('passport');
const session = require('express-session');
require('dotenv').config();
const client = process.env.CLIENT;

// const axios = require('axios');
// const cors = require('cors');

const indexRouter = require('./indexRouter');
const userRouter = require('./users/userRouter');
const authRouter = require('./userAuth/authRouter');
const fileRouter = require('./fileServer/fileRouter');
const User = require('./users/userModel');

const app = express();
app.use(cors());

mongoose.set('useFindAndModify', false);
const MongoStore = require('connect-mongo')(session);
const mongoDb = process.env.MONGO;
const sessionStore = new MongoStore({ url: mongoDb, collection: 'sessions' });

app.use(
  session({
    secret: 'gus',
    store: sessionStore,
    resave: false,
    saveUninitialized: true,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function (user, done) {
  console.log('serialize user: ', user);
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  console.log('deserialize user: ', user);
  User.findById(user._id, function (err, user) {
    done(err, user);
  });
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
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
