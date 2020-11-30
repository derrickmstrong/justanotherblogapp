// const createError = require('http-errors'),
//   express = require('express'),
//   logger = require('morgan'),
//   path = require('path'),
//   okta = require('@okta/okta-sdk-nodejs'),
//   session = require('express-session'),
//   ExpressOIDC = require("@okta/oidc-middleware").ExpressOIDC;

// const blogRouter = require('./routes/blog'),
//   usersRouter = require('./routes/users');

// const app = express();

// const client = new okta.Client({
//   orgUrl: 'https://dev-6714731-admin.okta.com',
//   token: '00EE30hr-GaVgksnCo-ervMl4HgrEZIRAiVDjv7s-5',
// });

// // View engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'pug');

// // Middlewares
// app.use(logger('dev')); // Morgan
// app.use(express.json()); // Parse form data
// app.use(express.urlencoded({ extended: false }));
// app.use(express.static(path.join(__dirname, 'public'))); // Serve static files

// /*
//  Handles the OpenID Connect authentication logic
//  Configuration options
// */
// const oidc = new ExpressOIDC({
//   issuer: 'https://dev-6714731-admin.okta.com/oauth2/default',
//   client_id: '0oa1ezhj1eDBYSD4M5d6',
//   client_secret: 'ulkPMytU7ZcMZVR-VdTN-41qhguJ741ZIJkO3H_Y',
//   redirect_uri: 'http://localhost:3000/users/callback',
//   scope: "openid profile",
//   routes: {
//     login: {
//       path: '/users/login'
//     },
//     callback: {
//       path: '/users/callback',
//       defaultRedirect: '/dashboard'
//     }
//   }
// });

// // Manages user cookies and remembers who a user is
// app.use(session({
//   secret: 'djsoijfo2i33902i3r9jnvosnvo9jf2fb2h9jd9s0#4i904i30_9392342093ijds37',
//   resave: true,
//   saveUninitialized: false
// }))

// // Creates routes for handling user authentication
// app.use(oidc.router)

// // Custom middleware - Used to easily access a currently logged in user's personal information
// app.use((req, res, next) => {
//   if(!req.userinfo) {
//     return next();
//   }
//   client.getUser(req.userinfo.sub)
//   .then(user => {
//     req.user = user;
//     res.locals.user = user;
//     next();
//   })
// });

// // Routes
// app.use('/', blogRouter);
// app.use('/users', usersRouter);

// // Catch 404 and forward to error handler
// app.use(function (req, res, next) {
//   next(createError(404));
// });

// // Error handlers
// app.use(function (err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};

//   // Render the error page
//   res.status(err.status || 500);
//   res.render('error');
// });

// module.exports = app;


const createError = require('http-errors');
const express = require('express');
const logger = require('morgan');
const path = require('path');
const session = require('express-session');
const ExpressOIDC = require('@okta/oidc-middleware').ExpressOIDC;

// Dotenv Config
require('dotenv').config();

const auth = require('./auth');
const blogRouter = require('./routes/blog');
const usersRouter = require('./routes/users');


// App initialization
const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

const oidc = new ExpressOIDC({
  issuer: process.env.OKTA_URL + 'oauth2/default',
  appBaseUrl: process.env.OKTA_BASE_URL,
  client_id: process.env.OKTA_CLIENT_ID,
  client_secret: process.env.OKTA_CLIENT_SECRET,
  redirect_uri: process.env.OKTA_REDIRECT_URI,
  scope: 'openid profile',
  routes: {
    login: {
      path: '/users/login',
    },
    callback: {
      path: '/users/callback',
      defaultRedirect: '/dashboard',
    },
  },
});

app.use(
  session({
    secret: process.env.SECRET,
    resave: true,
    saveUninitialized: false,
  })
);

app.use(oidc.router);

app.use((req, res, next) => {
  if (!req.userinfo) {
    return next();
  }

  auth.client.getUser(req.userinfo.sub).then((user) => {
    req.user = user;
    res.locals.user = user;
    next();
  });
});

// Routes
app.use('/', blogRouter);
app.use('/users', usersRouter);

// Error handlers
app.use(function (req, res, next) {
  next(createError(404));
});

app.use(function (err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;