const express = require('express');
const router = express.Router();
const request = require('request');
const ManagementClient = require('auth0').ManagementClient;

const manageAuth0 = new ManagementClient({
    //MAKE SURE THIS DOMAIN IS NOT A CUSTOM DOMAIN!!!
    domain: process.env.AUTH0_MGMT_DOMAIN,
    clientId: process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    scope: process.env.AUTH0_MGMT_SCOPES
});

const errorUrl = process.env.ERROR_URL;

const handleDelivery = (res, url, accessToken) => {
    const options = {
        url: url,
        json: true,
        headers: {
            'authorization': `bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    };
    request(options, function (error, response, body) {
        if (error) {
            res.status(302)
            res.send({"redirect": errorUrl + '/?error=Error_Sending_Request&status=422'})
            //res.send('hello')
        }
        res.json(body);
    });
};

router.get('/userinfo', function (req, res, next) {
    const url = `https://${process.env.AUTH0_DOMAIN}/userinfo`;
    handleDelivery(res, url, req.session.access_token);
});

router.get('/getUserAPI', function (req, res, next) {
    const url = `${process.env.API_HOST}/api/private/getUser`;
    handleDelivery(res, url, req.session.access_token);
});

router.get('/getUserApp', function (req, res, next) {

    // When using 'Auth0' Passport strategy, call wit thih profile.sub
    if (req.session.profile._json !== undefined) {

        var params = {
            id: req.session.profile._json.sub
        };

        manageAuth0.getUser(params)
            .then((output) => {
                res.json(output)

            })
            .catch((err) => {
                res.status(302);
                res.send({"redirect": errorUrl + '/?error=Error_Calling_Auth0_Get_User&status=422'})
            })

    }

    // When using 'oauth2-resource-owner' Passport strategy, call with this profile.sub
    if (req.session.profile._json === undefined) {

        profile = JSON.parse(req.session.profile)

        var params = {
            id: profile.sub
        };

        manageAuth0.getUser(params)
            .then((output) => {

                res.json(output)

            })
            .catch((err) => {
                res.status(302);
                res.send({"redirect": errorUrl + '/?error=Error_Calling_Auth0_Get_User&status=422'})
            })

    }

});

module.exports = router;