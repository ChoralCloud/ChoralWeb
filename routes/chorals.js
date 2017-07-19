var express = require('express');
var router = express.Router();
var Choral = require('../models/choral');
var viewHelpers = require('../helpers/viewHelpers');

router.get('/', function(req, res, next) {
  var googleUser = req.user;
  var userModel = res.locals.userModel;

  // grab all chorals belonging to the user.
  Choral.findAllForUser(userModel, (err, chorals) => {
    if (err) {
      console.log(err);
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
      res.flash('error', 'Choral validation failed: ' + err);
      return next(err);
    }
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

// this doesn't check to make sure the choral belong to the user but eff it for now
router.delete('/:choralId', function(req, res, next) {
  var googleUser = req.user;
  var userModel = res.locals.userModel;

  Choral.remove({ choralId: req.params.choralId }, (err) => {
    if (err) {
      console.log(err);
      res.flash('error', 'Unable to remove choral: ' + err);
      return next(err);
    }

    res.flash('success', 'Choral successfully deleted.');
    res.send('204'); // successful deletion
  });
});

module.exports = router;
