const express = require('express');
const passport = require('passport');
const router = express.Router();
const authorize = require('../utils/authorize').authorize;
const revokeRefreshToken = require('../utils/tokenUtils').revokeRefreshToken;

//Master Config
const env = {
  AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
  AUTH0_DOMAIN: process.env.AUTH0_DOMAIN,
  AUTH0_CALLBACK_URL: process.env.AUTH0_CALLBACK_URL || 'http://rwa.julianwilliam.com/callback',
  POPUP_LOGIN_REDIRECT_URL: process.env.POPUP_LOGIN_REDIRECT_URL || 'http://rwa.julianwilliam.com/callback',
  AUDIENCE: process.env.AUDIENCE || 'https://#{env.AUTH0_DOMAIN}/userinfo',
  SCOPE: process.env.SCOPE,
  CONNECTION: process.env.AUTH0_CONNECTION,
  CONFIGURATION_BASE_URL: process.env.AUTH0_CONFIGURATION_BASE_URL
};

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('base/index', { env: env });
});

router.get('/legacyLogin', function (req, res) {
  res.render('base/legacyLogin', { env: env });
});

router.get('/legacySignup', function (req, res) {
  res.render('base/legacySignup', { env: env });
});

router.get('/progressive_profile', function (req, res) {
  env.token = req.query.token
  env.state = req.query.state
  res.render('main/progressive_profile', { env: env });
});

router.get('/phishing', function (req, res) {
  env.phishing_login = process.env.PHISHING_LOGIN_URL
  res.render('base/phishing', { env: env });
});

router.post('/ropg', passport.authenticate('oauth2-resource-owner', {
  failureRedirect: '/failure'
}),
  function (req, res) {
    //successful authentication
    return res.redirect('/user');
  })

router.get('/signin', function (req, res) {
  authorize(req, res, false);
});

router.get('/auth', function (req, res) {
  if (req.user) {
    res.redirect('/user');
  }
    
   else {
    // check if SSO session exists..
    authorize(req, res, false, false);
  }
});

router.get('/apiAuth', function (req, res) {
  if (req.user) {
    res.redirect('/user');
  }
  
   else {
    // check if SSO session exists..
    authorize(req, res, false, true);
  }
});

router.get('/logout', function (req, res) {

  revokeRefreshToken(req.session.refresh_token)
    .then((body) => {
      req.session.destroy();
      const callbackUrl = process.env.AUTH0_CALLBACK_URL;
      const returnToUrl = callbackUrl.substr(0, callbackUrl.lastIndexOf('/'));
      res.redirect(`https://${process.env.AUTH0_DOMAIN}/v2/logout?returnTo=${returnToUrl}`);
    })
    .catch((err) => {
      req.session.destroy();
      res.redirect('/error?error=Logout error');
    })
});

router.get('/callback',
  passport.authenticate('auth0', { failureRedirect: '/failure' }),
  function (req, res) {
    // res.redirect(req.session.returnTo || '/user');
    res.redirect('/user');
  });

router.get('/popupCallback',
  passport.authenticate('auth0', { failureRedirect: '/failure' }),
  function (req, res) {
    res.redirect('/popup');
  });

router.get('/popup', function (req, res, next) {
  res.render('base/popup', { env: env });
});

router.get('/failure', function (req, res) {
  var error = req.flash('error');
  var errorDescription = req.flash('error_description');
  req.session.destroy();
  res.render('errors/failure', {
    error: error[0] || 'Not Found',
    error_description: errorDescription[0] || 'Not Found',
    env: env
  });
});

router.get('/error', function (req, res) {

  env.error = req.query.error || 'Not Found';
  env.status = req.query.status || 'Not Found';
  req.session.destroy();
  res.render('errors/error', {
    env: env
  });
});

module.exports = router;