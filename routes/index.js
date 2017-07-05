var express = require('express');
var router = express.Router();

/* GET home page. */

// if you get '/' and the request is authenticated then redirect them to the dashboard
router.get('/', function(req, res, next){
  if(req.isAuthenticated()){
    res.redirect('/dashboard');
  }
});

router.get('/dashboard', function(req, res, next) {
  res.render('dashboard', { user: req.user });
});

module.exports = router;
