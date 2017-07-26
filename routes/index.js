var express = require('express');
var router = express.Router();
var Choral = require('../models/choral');
var logHelper = require('../helpers/logHelper');

/* GET home page. */

// if you get '/' (login page) and the user is already logged in,
// then redirect them to the dashboard
// Otherwise, continue to the login page
router.get('/', function(req, res, next){
  if(req.isAuthenticated()){
    res.redirect('/home');
  }
});

router.get('/home', function(req, res, next) {
  var googleUser = req.user;
  var userModel = res.locals.userModel;

  // grab tree belonging to the user.
  /* 
    tree = {
      chorals,
      rootchorals,
      nodes,
      edges
    }
  */
  Choral.findTreeForUser(userModel, (err, tree) => {
    if (err) {
      console.log(err);
      logHelper.createLog("error", err, ["home", "tree", "findTreeForUser"]);
      return next(err);
    }

    var stats = {
      rps: 0
    };

    for (i in tree.rootChorals) {
      stats.rps += (1/tree.rootChorals[i].sampleRate)
    }

    res.render('home', { 
      googleUser: googleUser,
      userModel: userModel,
      chorals: tree.chorals,
      rootChorals: tree.rootChorals,
      nodes: tree.nodes,
      edges: tree.edges,
      stats: stats
    });
  });

});

module.exports = router;
