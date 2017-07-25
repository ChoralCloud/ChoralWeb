var express = require('express');
var router = express.Router();
var logHelper = require('../helpers/logHelper');

router.get('/', function(req, res, next) {
  res.render('events', {
    googleUser: req.user
  });
});

module.exports = router;
