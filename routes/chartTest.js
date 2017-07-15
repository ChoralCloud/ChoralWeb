var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.render('chartTest', {
    googleUser: req.user });
});

module.exports = router;
