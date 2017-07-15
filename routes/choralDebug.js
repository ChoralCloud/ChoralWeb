var express = require('express');
var router = express.Router();

router.get('/:deviceId', function(req, res, next) {
  res.render('choralDebug', {
    deviceId: req.params.deviceId,
    user: req.user
  });
});

module.exports = router;
