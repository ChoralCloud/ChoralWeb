var express = require('express');
var router = express.Router();
var Choral = require('../models/choral');
var viewHelpers = require('../helpers/viewHelpers');
var logHelper = require('../helpers/logHelper');

router.get('/', function(req, res, next) {
  var googleUser = req.user;
  var userModel = res.locals.userModel;

  // grab all chorals belonging to the user.
  Choral.findAllForUser(userModel, (err, chorals) => {
    if (err) {
      console.log(err);
      logHelper.createLog("error", err, ["chorals", "findAllForUser"]);
      return next(err);
    }

    // serialize the chorals and pass to chorals view
    res.render('chorals',
      {
        googleUser: googleUser,
        userModel: userModel,
        chorals: chorals,
        viewHelpers: viewHelpers
      }
    );
  });
});

router.post('/', function(req, res, next) {
  var googleUser = req.user;
  var userModel = res.locals.userModel;

  var attrs = {
    user: userModel,
    sampleRate: req.body.sampleRate,
    type: 'choral',
    name: req.body.name,
    func: req.body.func
  };

  Choral.createNew(attrs, (err, choral) => {
    if(err){
      console.log(err);
      logHelper.createLog("error", 'Choral validation failed: ' + err, ["chorals", "createNew"]);
      res.flash('error', 'Choral validation failed: ' + err);
      return next(err);
    }
    logHelper.createLog("success", 'New choral created: ' + JSON.stringify(attrs), ["chorals", "createNew"]);
    res.flash('success', 'New choral created.');
    res.redirect(req.baseUrl + '/new');
  });
});

router.get('/new', function(req, res, next) {
  var googleUser = req.user;
  var userModel = res.locals.userModel;

  res.render('newChoral',
    {
      googleUser: googleUser,
      userModel: userModel,
      viewHelpers: viewHelpers
    }
  );
});

router.delete('/:choralId', function(req, res, next) {
  var choralId = req.params.choralId;
  var userModel = res.locals.userModel;

  Choral.findOne({ choralId: choralId }, (err, choral) => {
    if (err) {
      logHelper.createLog("error", 'Choral does not exist: ' + err, ["chorals", "delete"]);
      console.log(err);
      res.flash('error', 'Choral does not exist');
      return res.send('404'); // notify client of failure
    }

    // ensure choral belongs to the current user
    if (choral.userId.toString() != userModel._id.toString()) {
      res.flash('error', 'Cannot remove a choral that does not belong to you.');
      return res.send('403'); // notify client of failure
    }

    Choral.remove({ choralId: choral.choralId }, (err) => {
      if (err) {
        logHelper.createLog("error", 'Error removing choral: ' + err, ["chorals", "delete"]);
        console.log(err);
        res.flash('error', 'Error removing choral');
        return res.send('500'); // notify client of failure
      }

      res.flash('success', 'Choral successfully deleted.');
      return res.send('204'); // successful deletion
    });
  });
});

module.exports = router;
