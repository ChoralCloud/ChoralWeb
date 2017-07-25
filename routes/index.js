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

  // grab all root chorals belonging to the user.
  Choral.findTreeForUser(userModel, (err, chorals, rootChorals, nodes, edges) => {
    if (err) {
      console.log(err);
      logHelper.createLog("error", err, ["home", "tree", "findTreeForUser"]);
      return next(err);
    }

    console.log('nodes: ' + JSON.stringify(nodes));
    console.log('edges: ' + JSON.stringify(edges));

    var stats = {
      rps: 0
    };

    for (i in rootChorals) {
      stats.rps += (1/rootChorals[i].sampleRate)
    }

    res.render('home', { 
      googleUser: googleUser,
      userModel: userModel,
      chorals: chorals,
      rootChorals: rootChorals,
      nodes: nodes,
      edges: edges,
      stats: stats
    });
  });

});

module.exports = router;
