const express = require('express');
const router = express.Router();
const jwtVerifier = require('jsonwebtoken');
const revokeRefreshToken = require('../../utils/tokenUtils').revokeRefreshToken;

const jwtVerifierOptions = {
  audience: process.env.JWT_AUDIENCE,
  issuer: process.env.JWT_ISSUER,
  algorithms: 'HS256'
}

const errorUrl = process.env.ERROR_URL;

router.get('/verifyJWT', (req, res) => {

  if (req.query.token) {

    var token = req.query.token;

    jwtVerifier.verify(token, process.env.JWT_SIGNING_KEY, jwtVerifierOptions, function (err, decoded) {

      if (err) {
        //res.status(err.status || 500);
        res.status(302);
        res.send({"redirect": errorUrl + '/?error=Token_not_Valid&status=422'})
      }
      else {
        res.setHeader('Content-Type', 'application/json');
        res.send(decoded)
      }
    });
  }
  else {
    res.status(302);
    //res.status(err.status || 500);
    res.send({"redirect": errorUrl + '/?error=Invalid_Request&status=422'})
  }

});

router.post('/revokeTokens', (req, res) => {

  if (req.body.revoke === true && req.session.refresh_token) {

    revokeRefreshToken(req.session.refresh_token)
    .then((body) => {
      res.send(req.session.refresh_token + ' revoked')
      req.session.destroy();
    })
    .catch((err) => {
      res.status(302);
      res.send({"redirect": errorUrl + '/?error=Error_Revoking_Token&status=422'})
      req.session.destroy();
    })
  }
  else {
    res.status(302);
    res.send({"redirect": errorUrl + '/?error=Invalid_Request&status=422'})
  }

});

module.exports = router;