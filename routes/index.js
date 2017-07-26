var express = require('express');
var router = express.Router();
var Choral = require('../models/choral');
var viewHelpers = require('../helpers/viewHelpers');
var logHelper = require('../helpers/logHelper');
var fs = require('fs');

const DEFAULT_FUNCS_DIR = 'sample_chorals/defaults';

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

    stats.rps = stats.rps.toFixed(3);
    
    Choral.findAllForUser(userModel, (err, chorals) => {
    if (err) {
      console.log(err);
      return next(err);
    }

    getDefaultFuncs() // fetch quick funcs
      .then(funcs => {

        // prepend empty quick func func, so that default is no quick func
        funcs.unshift({ fileName: 'None', func: '' });

        res.render('home', {
          googleUser: googleUser,
          userModel: userModel,
          viewHelpers: viewHelpers,
          chorals: chorals,
          treechorals: tree.chorals,
          rootChorals: tree.rootChorals,
          defaultFuncs: funcs,
          nodes: tree.nodes,
          edges: tree.edges,
          stats: stats
        });
      })
      .catch(err => {
        console.log(err)
        next(err);
      });
    });
  });
});

function getDefaultFuncs() {
  // read all default choral funcs from their files
  // return a promise that resolves to an array of strings,
  // which are the stringified funcs

  return new Promise((resolve, reject) => {
    fs.readdir(DEFAULT_FUNCS_DIR, (err, fileNames) => {
      if (err) {
        reject(err);
      }
      else {
        let fileContentPromises = fileNames
          .map((fileName) => readFile(DEFAULT_FUNCS_DIR + '/', fileName));

        // when all files are successfully read, return their contents
        Promise.all(fileContentPromises)
          .then(fileContents => {
            resolve(fileContents);
          })
          .catch(err => reject(err));
      }
    });
  });
}

function readFile(path, fileName) {
  return new Promise((resolve, reject) => {
    fs.readFile(path + fileName, 'utf-8', (err, data) => {
      if (err) reject(err);
      else resolve({ fileName: fileName, func: data });
    });
  });
}


module.exports = router;
