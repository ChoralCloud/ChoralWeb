var express = require('express'),
    router = express.Router(),
    Choral = require('../models/chorals.js'),
    User = require('../models/user.js')


// if you get '/' (login page) and the user is already logged in,
// then redirect them to the dashboard
// Otherwise, continue to the login page
router.get('/', function(req, res, next){
  if(req.isAuthenticated()){
    res.redirect('/dashboard');
  }
});

router.get('/dashboard', function(req, res, next) {
  res.render('dashboard', { user: req.user });
});

router.get('/chorals', function(req, res, next) {
  var chorals = [];

  res.render('chorals', {
    user: req.user,
    choral: chorals
  });
});

module.exports = router;
