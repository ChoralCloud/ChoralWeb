var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var users = require('./routes/users');
var ws = require('./routes/websocket');

var app = express();

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
