var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/dashboard', function(req, res, next) {
  console.log(req.user);
  res.render('dashboard', { user: req.user });
});

module.exports = router;
