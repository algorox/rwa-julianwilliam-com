const express = require('express');
const router = express.Router();
const ManagementClient = require('auth0').ManagementClient;
const passport = require('passport');

const manageAuth0 = new ManagementClient({
  //MAKE SURE THIS DOMAIN IS NOT A CUSTOM DOMAIN!!!
  domain: process.env.AUTH0_MGMT_DOMAIN,
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  scope: process.env.AUTH0_MGMT_SCOPES
});

const errorUrl = process.env.ERROR_URL;

router.post('/legacySignUp', (req, res, next) => {

  if (req.body.username && (req.body.password.length >= 8)) {
    var params = {
      connection: process.env.LEGACY_SIGN_UP_CONNECTION,
      email: req.body.username,
      email_verified: false,
      verify_email: true,
      password: req.body.password
    };

    manageAuth0.createUser(params)
      .then((output) => {

        next()
        return;

      })
      .catch((err) => {
        res.status(302);
        res.send({"redirect": errorUrl + '/?error=Error_Calling_Auth0_Create_User&status=422'})
      })
  }

  else {
    res.status(302);
    res.send({"redirect": errorUrl + '/?error=Invalid_Request&status=422'})
  }

});

//
// Following router /signup must come next()
//

router.post('/legacySignUp', passport.authenticate('oauth2-resource-owner', {
  failureRedirect: '/failure'
}),
  function (req, res) {
    //successful authentication
    return res.redirect('/user');
  })

module.exports = router;