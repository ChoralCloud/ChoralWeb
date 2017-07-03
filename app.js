var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

// auth stuff
const session = require('express-session')
const passport = require('passport')
const RedisStore = require('connect-redis')(session)
const GoogleStrategy = require('passport-google-oauth20').Strategy

var index = require('./routes/index');
var users = require('./routes/users');
var ws = require('./routes/websocket');
const config = require('./config')


var app = express();


app.use(bodyParser.urlencoded({
  extended: false
}))


passport.authenticationMiddleware = function () {
  return function (req, res, next) {
    if (req.isAuthenticated()) {
      return next()
    }
    res.redirect('/')
  }
}

app.use(passport.initialize())

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
    cb(null, extractProfile(profile));
  }
));

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
    const redirect = req.session.oauth2return || '/';
    delete req.session.oauth2return;
    res.redirect(redirect);
  }
);

app.use(session({
  store: new RedisStore({
    url: config.redisStore.url
  }),
  secret: config.redisStore.secret,
  resave: false,
  saveUninitialized: false
}))

app.use(passport.session())

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});


// Setup websocket connection
var server = require('http').Server(app);
var io = require('socket.io')(server);
var wsHandler = require('./ws/ws_handler').handler;
var wsClients = require('./ws/ws_handler').clients;

io.on('connection', function (socket) {
  wsHandler(socket);
});

// testing function to emit time series data to all websocket clients
function sendWSData() {
  setTimeout(function() {
    var d = new Date();
    var time_ms = d.getTime(); // millis

    for (var i = 0; i < wsClients.length; i++) {
      var wsClient = wsClients[i];
      if (wsClient !== undefined) {
        wsClient.emit('chartData', {
          time: time_ms,
          value: Math.cos(time_ms) + 1
        });
      }
    }
    sendWSData();
  }, 1000);
}
sendWSData();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);
app.use('/ws', ws);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = { app: app, server: server };
