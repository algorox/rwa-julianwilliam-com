const express = require('express');
const router = express.Router();
const jwtVerifier = require('jsonwebtoken');
const ManagementClient = require('auth0').ManagementClient;

const manageAuth0 = new ManagementClient({
    //MAKE SURE THIS DOMAIN IS NOT A CUSTOM DOMAIN!!!
    domain: process.env.AUTH0_MGMT_DOMAIN,
    clientId: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    scope: process.env.AUTH0_MGMT_SCOPES
});


const jwtVerifierOptions = {
    audience: process.env.JWT_AUDIENCE,
    issuer: process.env.JWT_ISSUER,
    algorithms: 'HS256'
}

const errorUrl = process.env.ERROR_URL;

router.post('/progressive_profile', function (req, res, next) {

    if (req.body.state && req.body.token) {

        var token = req.body.token;

        jwtVerifier.verify(token, process.env.JWT_SIGNING_KEY, jwtVerifierOptions, function (err, decoded) {

            if (err) {
                res.status(302);
                res.redirect(errorUrl + '/?error=Error_Verifying_Token&status=422');
            }
            else {

                params = {
                    id: decoded.sub
                }

                metadata = {
                    location: req.body.location,
                    age: req.body.age,
                    favourite_sports_car: req.body.car
                }

                manageAuth0.updateUserMetadata(params, metadata)
                    .then((output) => {

                        url = `https://${process.env.AUTH0_DOMAIN}`

                        res.redirect(url + "/continue?state=" + req.body.state)

                    })
                    .catch((err) => {
                        res.status(302);
                        res.redirect(errorUrl + '/?error=Error_Calling_Auth0_Update_User&status=422');
                    })

            }
        });

    }

    else {
        res.redirect(errorUrl + '/?error=Invalid_Request&status=422');
    }

});

router.post('/skip_progressive_profile', function (req, res, next) {

    url = `https://${process.env.AUTH0_DOMAIN}`

    // When using 'Auth0' Passport strategy, call wit thih profile.sub
    if (req.body.state) {

        res.redirect(url + "/continue?state=" + req.body.state)

    }

    else {
        res.status(302);
        res.redirect(errorUrl + '/?error=Invalid_Request&status=422');
    }

});

module.exports = router;