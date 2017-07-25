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

router.get('/edit/:choralId', function(req, res, next) {
  var googleUser = req.user;
  var userModel = res.locals.userModel;
  var choralId = req.params.choralId;

  Choral.findOne({
    userId: userModel,
    choralType: "device",
    choralId: choralId
    }, (err, device) => {
    res.render('editDevice', {
      googleUser: googleUser,
      userModel: userModel,
      deviceEdit: device
    });
  });
});


router.post('/edit/:choralId', function(req, res, next) {
  var googleUser = req.user;
  var userModel = res.locals.userModel;
  var choralId = req.params.choralId;

  var attrs = {
    user: userModel,
    sampleRate: req.body.sampleRate,
    type: 'device',
    name: req.body.name,
    func: req.body.func
  };

  Choral.findOne({ choralId: choralId }, (err, device) => {
    if (err || !device) {
      console.log(err);
      res.flash('error', 'Device does not exist');
      return res.send('404'); // notify client of failure
    }
    device.edit(attrs, (err) => {
      if(err){
        console.log(err);
        res.flash('error', 'Device validation failed: ' + err);
        return res.redirect(req.originalUrl + '/');
      }
      res.flash('success', 'Device Edited');
      res.redirect(req.baseUrl + '/');
    });
  });
});

router.get('/new', function(req, res, next) {
  res.render('newDevice', {
    googleUser: req.user
  });
});

module.exports = router;
