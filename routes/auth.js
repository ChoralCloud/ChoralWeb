const passport = require('passport')
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
    image: imageUrl,
    emails: profile.emails.map((email) => email.value),
    firstName: profile.name.givenName,
    lastName: profile.name.familyName
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

// Called when "login" is clicked on the index page
app.get('/auth/google', (req, res, next) => {
  // Save the url of the user's current page so the app can redirect back to
  // it after authorization
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
// OAuth 2 callback url. Use this url to configure your OAuth client in the
// Google Developers console
app.get('/auth/google/callback',
  passport.authenticate('google'), // Finish OAuth 2 flow using Passport.js
  (req, res) => {
    // Redirect back to the original page, if any
    const redirect = req.session.oauth2return || '/dashboard';
    delete req.session.oauth2return;

    res.redirect(redirect);
  }
);

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

module.exports = {
  router: app,
};
