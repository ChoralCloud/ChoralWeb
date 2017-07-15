var express = require('express');
var router = express.Router();
var Choral = require('../models/choral');
var viewHelpers = require('../helpers/view_helpers');

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

router.post('/create', function(req, res, next) {
  var googleUser = req.user;
  var userModel = res.locals.userModel;

  // grab post data
  // try to create new user with the data

  Choral.createNew(userModel, (err, chorals) => {
    if (err) {
      console.log(err);
      return next(err);
    }

    // // serialize the chorals and pass to chorals view
    // res.render('newChoral',
    //   {
    //     googleUser: googleUser,
    //     userModel: userModel,
    //     chorals: chorals,
    //     viewHelpers: viewHelpers
    //   }
    // );
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

module.exports = router;
