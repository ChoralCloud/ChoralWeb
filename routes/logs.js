var express = require('express');
var router = express.Router();
var Log = require('../models/log');

/* GET logs page. */
router.get('/', function(req, res, next) {
  Log.findAll((err, logs) => {
    if (err) {
      console.log(err);
      return next(err);
    }
    logs = JSON.parse(JSON.stringify(logs))
    res.render('logs',
      {
        logs: logs
      }
    );
  });
});

module.exports = router;