const express = require('express');
const ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn;
const router = express.Router();


var profile = {}

function setUpUser(profile, res) {

  const env = {
    USER_ID: profile.sub,
    NICKNAME: profile.nickname,
    NAME: profile.name,
    PICTURE: profile.picture,
    UPDATEDAT: profile.updated_at,
    AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
    AUTH0_DOMAIN: process.env.AUTH0_DOMAIN,
    EMBEDDED_DOMAIN: process.env.EMBEDDED_DOMAIN,
    AUTH0_CALLBACK_URL: process.env.AUTH0_CALLBACK_URL || 'http://rwa.julianwilliam.com/callback',
    POPUP_LOGIN_REDIRECT_URL: process.env.POPUP_LOGIN_REDIRECT_URL || 'http://rwa.julianwilliam.com/callback',
    AUDIENCE: process.env.AUDIENCE || 'https://#{env.AUTH0_DOMAIN}/userinfo',
    SCOPE: process.env.SCOPE,
    CONNECTION: process.env.AUTH0_CONNECTION
  };
  res.render('main/basic_services', { env: env });

}

/* GET user profile. */
router.get('/', ensureLoggedIn('/auth'), function (req, res, next) {

  //
  // When using ROPG Passport Strategy, use this profile
  //

  if (req.user._json === undefined) {

    profile = JSON.parse(req.user)
    setUpUser(profile, res)
  }

  //
  // When using AUTH0 Passport Strategy, use this profile
  //

  else {
    profile = req.user
    setUpUser(profile, res)
  }
  

});

module.exports = router;