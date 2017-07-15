var express = require('express');
var router = express.Router();
var Choral = require('../models/choral');

router.get('/', function(req, res, next) {
  res.render('deviceReg', {
    googleUser: req.user });
});

router.post('/', function(req, res, next) {  
  var attrs = {
    user: res.locals.userModel,
    sampleRate: req.body.sampleRate,
    type: 'device',
    name: req.body.deviceName
  };

  var device = Choral.createNew(attrs, (err, c) => {
    if(err){
      console.log(err);
      return next(err);
    }
    console.log(c);
  }); 

  console.log('Device Created!')
  console.log('Device Name: ' + req.body.deviceName);
  console.log('Device ID: ' + device.choralId);
  res.render('deviceReg', {googleUser: req.user, devID: device.choralId});
});

module.exports = router;
