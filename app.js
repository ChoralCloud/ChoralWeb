var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var User = require('./models/user');
var redisPubSub = require('./ws/redisPubSub');

// auth stuff
const session = require('express-session')
const passport = require('passport')
const RedisStore = require('connect-redis')(session)

var index = require('./routes/index');
var chartTest = require('./routes/chartTest');
const config = require('./config')
var app = express();

// session stuff
app.use(session({
  store: new RedisStore({
    url: config.redisStore.url,
    logErrors: function() {
      console.log('ERROR!!!: There was an error opening the redis connection. Ensure the redis container is up. Exiting.')
      process.exit();
    }
  }),
  secret: config.redisStore.secret,
  resave: false,
  saveUninitialized: false
}))

app.use(passport.initialize())
app.use(passport.session())
// end session stuff

// authentication stuff
app.use(require('./routes/auth.js').router)

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
// render the index page and any of the static files without authentication
app.use(express.static(path.join(__dirname, 'public')));

// only continue if the request is authenticated
app.use(function(req, res, next){
  if (req.isAuthenticated()) return next();
  res.render('index');
});

// // Fetch from the database or create a new document for the authenticated user
app.use(function(req, res, next){
  User.findOrCreateBefore(req.user, (userModel) => {
    res.locals.userModel = userModel;
    next();
  });
});

app.use(bodyParser.urlencoded({
  extended: false
}))

// Setup websocket connection
var server = require('http').Server(app);
var io = require('socket.io')(server);
var sockets = require('./ws/sockets');
var wsHandler = sockets.handler;
var wsClients = sockets.clients;

io.on('connection', function (socket) {
  wsHandler(socket);
});

sockets.sendTestWSData(wsClients);

// subscribe to channel example for channel '0'
// can unsubscribe with redisPubSub.redisUnsubscribe('0');
redisPubSub.redisSubscribe('0');

// uncomment after placing your favicon in /public
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/', index);
app.use('/chart_test', chartTest);

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
