const express = require('express');
const ejsLayouts = require('express-ejs-layouts');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const dotenv = require('dotenv');
const passport = require('passport');
const Auth0Strategy = require('passport-auth0');
const OAuth2ResourceOwnerStrategy = require('passport-oauth2-resource-owner-credentials')
const flash = require('connect-flash');
const helmet = require('helmet');
const cors = require('cors');
const ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
const ensureTokenValid = require('./utils/ensureTokenValid');


dotenv.load();

const routes = require('./routes/index');
const user = require('./routes/user');
const profileAPIs = require('./routes/apis/profile');
const signUpAPIs = require('./routes/apis/signup');
const utilAPIs = require('./routes/apis/utils');
const auth0rulesAPIs = require('./routes/apis/auth0rules');

//////////////////////////////////////////////////////////////////////////////
//HTTPS TURNED OFF IN PASSPORT JS MODULE _ NOT TO BE USED IN PRODUCTION!!!////
//JUST ADD THE HTTPS BACK IF NEEDED///////////////////////////////////////////
//////////////////////////////////////////////////////////////////////////////

// This will configure Passport to use Auth0
const strategy = new Auth0Strategy({
  domain: process.env.AUTH0_DOMAIN,
  clientID: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  callbackURL: process.env.AUTH0_CALLBACK_URL || 'http://algorox.com:3000/callback',
  passReqToCallback: true
}, function (req, access_token, refresh_token, extraParams, profile, done) {

  // This callback is invoked event after authorize call originating
  // server-side
  // accessToken is the token to call Auth0 API
  // extraParams.id_token has the JSON Web Token
  // profile has all the information from the user

  req.session.access_token = access_token;
  req.session.refresh_token = refresh_token;
  req.session.expires_in = extraParams.expires_in;
  req.session.id_token = extraParams.id_token;
  req.session.profile = profile;
  return done(null, profile);
});

OAuth2ResourceOwnerStrategy.prototype.tokenParams = function (options) {
  return {
    scope: process.env.SCOPE,
    audience: process.env.AUDIENCE
  };
};

OAuth2ResourceOwnerStrategy.prototype.userProfile = function (access_token, done) {

  this._oauth2.get(`https://${process.env.AUTH0_DOMAIN}/userinfo`, access_token,
    function (err, userinfo) {
      if (err) {
        return done(err);
      }
      if (!userinfo) {
        return done(new Error('No Userinfo Returned'));
      }
      return done(null, userinfo);
    }
  );
}

const ropgStrategy = new OAuth2ResourceOwnerStrategy({
  tokenURL: `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
  clientID: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  passReqToCallback: true
},
  function (req, access_token, refresh_token, profile, done) {

    req.session.access_token = access_token;
    req.session.refresh_token = refresh_token;
    req.session.profile = profile;

    return done(null, profile);

  })

const redisOptions = {
  url: process.env.REDIS_URL
}

//milliseconds in an hour
const hour = 60000 * 60;
const day = 24;
const week = 7;
const numberOfWeeks = 12

const sessionLength = hour * day * week * numberOfWeeks;
//only use short session for testing
//const sessionLength = 10000;

passport.use(ropgStrategy);
passport.use(strategy);

// you can use this section to keep a smaller payload
passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

const app = express();

corsOptions = {
  origin: '*'
}

app.use(cors(corsOptions))
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(ejsLayouts);
app.set('layout extractScripts', true);

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(helmet())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

app.use(cookieParser(process.env.SESSION_SECRET));
app.use(session({
  store: new RedisStore(redisOptions),
  secret: process.env.SESSION_SECRET,
  resave: false,
  name: 'twelveWeekSession',
  saveUninitialized: false,
  cookie: { 
    httpOnly: true, 
    maxAge: sessionLength,
    domain: process.env.COOKIE_DOMAIN
  }
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

app.use(flash());

// Handle auth failure error messages
app.use(function (req, res, next) {
  if (req && req.query && req.query.error) {
    req.flash('error', req.query.error);
  }
  if (req && req.query && req.query.error_description) {
    req.flash('error_description', req.query.error_description);
  }
  next();
});

// Check logged in
app.use(function (req, res, next) {
  res.locals.loggedIn = false;
  if (req.session.passport && typeof req.session.passport.user !== 'undefined') {
    res.locals.loggedIn = true;
  }
  next();
});

app.use('/', routes);
app.use('/user', ensureLoggedIn('/auth'), ensureTokenValid, user);
app.use('/api/profile', ensureLoggedIn('/apiAuth'), ensureTokenValid, profileAPIs);
app.use('/api/utils', ensureLoggedIn('/apiAuth'), ensureTokenValid, utilAPIs);
app.use('/api/auth0rules', auth0rulesAPIs);
app.use('/api/signup', signUpAPIs);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {

  app.use(function (err, req, res, next) {
    console.log(err)
    //res.status(err.status || 500);
    status = err.status || 500
    res.redirect('/error' + '?status=' + status + '&error=' + err.message)
   
  })

  
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
  //res.status(err.status || 500);
  status = err.status || 500
  res.redirect('/error' + '/?status=' + status + '&error=' + '')

});

module.exports = app;
