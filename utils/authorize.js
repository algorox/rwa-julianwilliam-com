const uuidv4 = require('uuid/v4');

//OAUTH 2.0 Authorization Code Request
const env = {
  AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID,
  AUTH0_DOMAIN: process.env.AUTH0_DOMAIN,
  AUTH0_CALLBACK_URL: process.env.AUTH0_CALLBACK_URL || 'http://rwa.julianwilliam.com/callback',
  AUDIENCE: process.env.AUDIENCE || 'https://auth.julianwilliam.com/userinfo',
  SCOPE: process.env.SCOPE,
  CONNECTION: process.env.AUTH0_CONNECTION || 'Username-Password-Authentication'
};

function authorize (req, res, promptNone, api) {
  promptNone = promptNone || false;
  req.session.state = uuidv4();
  //CHANGE TO HTTPS IN PRODUCTION!!!!
  let url = `http://${env.AUTH0_DOMAIN}/authorize?response_type=code&client_id=${env.AUTH0_CLIENT_ID}` +
      `&redirect_uri=${env.AUTH0_CALLBACK_URL}&audience=${env.AUDIENCE}&state=${req.session.state}&scope=${env.SCOPE}&connection=${env.CONNECTION}`;
  if (promptNone) {
    url = `${url}&prompt=none`;
  }
  if (!promptNone) {
    url = `${url}&prompt=login`;
  }

  if (api === true)
  {
  res.status(302)
  res.send({"redirect": url})
  }
  else
  {
    res.redirect(url);
  }

}

module.exports = {
  authorize
};
