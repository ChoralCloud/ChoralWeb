var express = require('express');
var router = express.Router();

/* GET home page. */

// if you get '/' (login page) and the user is already logged in,
// then redirect them to the dashboard
// Otherwise, continue to the login page
router.get('/', function(req, res, next){
  if(req.isAuthenticated()){
    res.redirect('/home');
  }
});

router.get('/home', function(req, res, next) {
  res.render('home', { googleUser: req.user });
});

module.exports = router;
