var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.render('choralDebug', {
    user: req.user });
});

module.exports = router;
