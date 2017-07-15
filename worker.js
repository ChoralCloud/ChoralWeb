var express = require('express')
var path = require('path')
var logger = require('morgan')
var User = require('./models/user')
var Choral = require('./models/choral')

require('./worker/updateChorals')

var redis = require("redis"),
    client = redis.createClient(process.env.REDIS_STORE_URI)

// if you'd like to select database 3, instead of 0 (default), call
// client.select(3, function() { /* ... */ })

client.on("error", function (err) {
    console.log("Error " + err)
})

var app = express()

// view engine setup
app.set('views', path.join(__dirname, 'worker/views'))
app.set('view engine', 'pug')

// uncomment after placing your favicon in /public
app.use(logger('dev'))

app.get('/choral_list', (req, res, next) => {
  res.render("choral_list")
})

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found')
  err.status = 404
  next(err)
})

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message
  res.locals.error = req.app.get('env') === 'development' ? err : {}

  // render the error page
  res.status(err.status || 500)
  res.render('error')
})

module.exports = { app: app }
