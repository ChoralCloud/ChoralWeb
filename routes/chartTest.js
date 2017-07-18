var express = require('express');
var router = express.Router();

router.get('/:deviceId', function(req, res, next) {
  res.render('chartTest', {
    googleUser: req.user,
    deviceId: req.params.deviceId
  });
});

module.exports = router;
