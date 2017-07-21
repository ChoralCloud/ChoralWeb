var express = require('express');
var router = express.Router();
var Choral = require('../models/choral');
var viewHelpers = require('../helpers/viewHelpers');
var logHelper = require('../helpers/logHelper');

router.get('/', function(req, res, next) {
  var googleUser = req.user;
  var userModel = res.locals.userModel;

  // grab all devices belonging to the user.
  Choral.findDevicesForUser(userModel, (err, devices) => {
    if (err) {
      console.log(err);
      logHelper.createLog("error", err, ["devices", "findDevicesForUser"]);
      return next(err);
    }

    // serialize the devices and pass to devices view
    res.render('devices',
      {
        googleUser: googleUser,
        userModel: userModel,
        devices: devices,
        viewHelpers: viewHelpers
      }
    );
  });
});

router.post('/', function(req, res, next) {
  var attrs = {
    user: res.locals.userModel,
    sampleRate: req.body.sampleRate,
    type: 'device',
    name: req.body.deviceName
  };

  Choral.createNew(attrs, (err, device) => {
    if(err){
      console.log(err);
      logHelper.createLog("error", err, ["devices", "createNew"]);
      return next(err);
    }
    logHelper.createLog("success", 'New device created: ' + JSON.stringify(attrs), ["devices", "createNew"]);
    res.render('newDevice', {googleUser: req.user, devID: device.choralId});
    console.log('Device Created!')
    console.log('Device Name: ' + req.body.deviceName);
    console.log('Device ID: ' + device.choralId);
  });
});

router.get('/new', function(req, res, next) {
  res.render('newDevice', {
    googleUser: req.user
  });
});

module.exports = router;
