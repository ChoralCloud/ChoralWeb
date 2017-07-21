/*var express = require('express');
var router = express.Router();
var Choral = require('../models/choral');
var mongoose = require('mongoose');

router.get('/new', function(req, res, next) {
  var googleUser = req.user;
  var userModel = res.locals.userModel;

  // grab all chorals belonging to the user.
  Choral.findAllForUser(userModel, (err, chorals) => {
    if (err) {
      console.log(err);
      return next(err);
    }

    // serialize the chorals and pass to chorals view
    res.render('newChild',
      {
        googleUser: googleUser,
        userModel: userModel,
        chorals: chorals,
      }
    );
  });
});

router.post('/', function(req, res, next) {
  var googleUser = req.user;
  var userModel = res.locals.userModel;
  var parentChoralId = req.body.parentChoral;
  var childChoralId = req.body.childChoral;

  console.log(parentChoralId);
  console.log(childChoralId);

  Choral.findOne({'choralId': parentChoralId}, function (err, parent){
    if(err){
      console.log(err);
      return next(err);
    } 
    else {
      Choral.findOne({'choralId': childChoralId}, function (err, child){
        parent.addChild(child, function(err){
          if(err){
            console.log(err);
            res.flash('error', 'Children addition failed: ' + err);
            res.redirect(req.baseUrl + '/new');
            return next(err);
          }
          else{
            res.flash('success', 'Children choral has been added.');
            res.redirect(req.baseUrl + '/new');
          }   
        });
      });
    }
  });
});

module.exports = router;*/
