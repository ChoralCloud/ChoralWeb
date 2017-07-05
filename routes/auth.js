const session = require('express-session')
const passport = require('passport')
const RedisStore = require('connect-redis')(session)
const GoogleStrategy = require('passport-google-oauth20').Strategy
const config = require('../config')
var express = require('express');

// extract google profile
function extractProfile (profile) {
  var imageUrl = '';
  if (profile.photos && profile.photos.length) {
    imageUrl = profile.photos[0].value;
  }
  var ret = {
    id: profile.id,
    displayName: profile.displayName,
    image: imageUrl
  };
  return ret;
}

passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser((obj, cb) => {
  cb(null, obj);
});

// Use the GoogleStrategy within Passport.
//   Strategies in passport require a `verify` function, which accept
//   credentials (in this case, a token, tokenSecret, and Google profile), and
//   invoke a callback with a user object.
passport.use(new GoogleStrategy({
    clientID: config.google.clientID,
    clientSecret: config.google.clientSecret,
    callbackURL: config.google.callbackURL,
    accessType: 'offline',
  }, (accessToken, refreshToken, profile, cb) => {
    // Extract the minimal profile information we need from the profile object
    // provided by Google
    // the information returned by extractProfile is saved in req.user
    cb(null, extractProfile(profile));
  }
));

const app = express.Router();

app.get(
  // Login url
  '/auth/google',

  // Save the url of the user's current page so the app can redirect back to
  // it after authorization
  (req, res, next) => {
    if (req.query.return) {
      req.session.oauth2return = req.query.return;
    }
    next();
  },

  // Start OAuth 2 flow using Passport.js
  passport.authenticate('google', { scope: ['email', 'profile'] })
);
// [END authorize]

// [START callback]
app.get(
  // OAuth 2 callback url. Use this url to configure your OAuth client in the
  // Google Developers console
  '/auth/google/callback',

  // Finish OAuth 2 flow using Passport.js
  passport.authenticate('google'),

  // Redirect back to the original page, if any
  (req, res) => {
    const redirect = req.session.oauth2return || '/dashboard';
    delete req.session.oauth2return;
    res.redirect(redirect);
  }
);

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

module.exports = {
  router: app,
};
