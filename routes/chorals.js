var express = require('express');
var router = express.Router();
var Choral = require('../models/choral');
var viewHelpers = require('../helpers/viewHelpers');
var logHelper = require('../helpers/logHelper');
var cookieHelper = require('../helpers/cookieHelper');
var client = require('redis').createClient(process.env.REDIS_STORE_URI)
const cassandra = require('cassandra-driver');
const cass_client = new cassandra.Client({contactPoints: [process.env.CASSANDRA_URL], keyspace: 'choraldatastream'});

router.get('/', function(req, res, next) {
  var googleUser = req.user;
  var userModel = res.locals.userModel;

  // grab all chorals belonging to the user.
  Choral.findAllForUser(userModel, (err, chorals) => {
    if (err) {
      console.log(err);
      logHelper.createLog("error", err, ["chorals", "findChoralsForUser"]);
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
  var cookies = req.get("Cookie");
  var children = [];
  var child; 

  for(var i = 0; cookieHelper.readCookie('child' + i, cookies) != null; i++){
    child = cookieHelper.readCookie('child' + i, cookies);
    child = JSON.parse(child);
    children.push(child.choralId);
  } 

  var attrs = {
    user: userModel,
    sampleRate: req.body.sampleRate,
    type: 'choral',
    name: req.body.name,
    func: req.body.func,
    children: children
  };

  Choral.createNew(attrs, (err, choral) => {
    if(err){
      console.log(err);
      logHelper.createLog("error", 'Choral validation failed: ' + err, ["chorals", "createNew"]);
      res.flash('error', 'Choral validation failed: ' + err);
      return res.redirect(req.baseUrl + '/new');
    }
    logHelper.createLog("success", 'New choral created: ' + JSON.stringify(attrs), ["chorals", "createNew"]);
    res.flash('success', 'New choral created.');
    res.redirect(req.baseUrl + '/new');
  });
});

router.get('/new', function(req, res, next) {
  var googleUser = req.user;
  var userModel = res.locals.userModel;

  Choral.findAllForUser(userModel, (err, chorals) => {
    if (err) {
      console.log(err);
      return next(err);
    }
    
    //Delete child cookies if page is reloaded
    var cookies = req.get("Cookie");
    for(var i = 0; cookieHelper.readCookie('child' + i, cookies) != null; i++){
      res.clearCookie('child' + i);
    }

    res.render('newChoral',
      {
        googleUser: googleUser,
        userModel: userModel,
        viewHelpers: viewHelpers,
        chorals: chorals
      }
    );
  });
});


// get the choral page
router.get('/:choralId', function(req, res, next) {
  var choralId = req.params.choralId;
  var userModel = res.locals.userModel;

  // 1. get sample rate of the chorals
  // 2. default currently is 1 hour of data, so get (3600/sampleRate) data points
  // 3. put them into object where {tabName: [data_points]} so FE doesn't need to do any work
  let p = new Promise((resolve, reject) => {
    var ret = {};
    Choral.findOne({ choralId: choralId }, (err, choral) => {
      if (err || !choral) {
        logHelper.createLog("error", 'Choral does not exist: ' + err, ["chorals", "get"]);
        console.log(err);
        res.flash('error', 'Choral does not exist');
        return res.send('404'); // notify client of failure
      }
      ret.choralInfo = {
        sampleRate: choral.sampleRate,
        name: choral.name
      }
      resolve(ret);
    });
  });

  p.then((ret) => {
    return new Promise((resolve,reject) => {
      client.hgetall(choralId, (err, data) => {
        if(err) {
          logHelper.createLog("error", 'Choral data has not yet been published to redis: ' + err, ["chorals", "get"]);
          console.log(err);
          res.flash('error', 'Choral does not exist');
          return res.send('404'); // notify client of failure
        }
        var tabs = [];
        if(data == null) {
          console.log("data is null");
        } else {
          var parsedData = JSON.parse(data.device_data);
          for( key in parsedData ) {
            var val = parsedData[key];
            if( !isNaN(parseFloat(val)) && isFinite(val) ) {
              tabs.push(key);
            }
          }
        }
        ret.tabs = tabs;
        resolve(ret);
      });
    });
  }).then((ret) => {
    return new Promise((resolve, reject) => {
      cass_client.execute("SELECT * FROM choraldatastream.raw_data WHERE device_id = '" + choralId + "' order by device_timestamp DESC limit " + 3600/ret.choralInfo.sampleRate, function( err, result ) {
        var sorted_results = {};
        var rows = result.rows.reverse();
        for( var i = 0; i < ret.tabs.length; i++ ) {
          sorted_results[ret.tabs[i]] = [];
        }

        for( var i = 0; i < rows.length; i++ ) {
          date = rows[i].device_timestamp;
          date = Date.parse(date);
          for( var j = 0; j < ret.tabs.length; j++ ) {
            data = JSON.parse(rows[i].device_data)
            sorted_results[ret.tabs[j]].push({
              time: date/1000,
              y: data[ret.tabs[j]]
            });
          }
        }
        ret.pastData = sorted_results;
        resolve(ret);
      });
    });
  }).then((ret)=> {
    res.render('choral', {
      googleUser: req.user,
      parentChoralId: req.params.choralId,
      tabs: ret.tabs,
      pastData: ret.pastData,
      choralInfo: ret.choralInfo
    });
  });
});

router.delete('/:choralId', function(req, res, next) {
  var choralId = req.params.choralId;
  var userModel = res.locals.userModel;

  Choral.findOne({ choralId: choralId }, (err, choral) => {
    if (err || !choral) {
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

router.get('/edit/:choralId', function(req, res, next) {
  var googleUser = req.user;
  var userModel = res.locals.userModel;
  var choralId = req.params.choralId;
  var children = [];

  // grab all chorals belonging to the user.
  Choral.findAllForUser(userModel, (err, chorals) => {
    if (err) {
      console.log(err);
      return next(err);
    }

    Choral.findOne({ choralId: choralId }, (err, choral) => {
      if (err) {
        console.log(err);
        res.flash('error', 'Choral does not exist');
        return res.send('404'); // notify client of failure
      }
      //Iterate and store all children chorals to be displayed
      for(var i = 0; i < choral.children.length; i++){
        Choral.findOne({ _id: choral.children[i] }, (err, child) => {
          if (err) {
            console.log(err);
            res.flash('error', 'Choral does not exist');
            return res.send('404'); // notify client of failure
          }
          console.log(child.name);
          children.push(child.name);
          console.log(children);
        });
      }
      //Delete child cookies if page is reloaded
      var cookies = req.get("Cookie");
      for(var i = 0; cookieHelper.readCookie('child' + i, cookies) != null; i++){
        res.clearCookie('child' + i);
      }
      //Pass choral to be edited and list of chorals
      console.log("CHILDREN PASSED ARE");
      console.log(children);

      //Pass choral to be edited and list of chorals
      res.render('editChoral',
        {
          googleUser: googleUser,
          userModel: userModel,
          chorals: chorals,
          choralEdit: choral,
          children: children
        }
      );
    });
  });
});

router.post('/edit/:choralId', function(req, res, next) {
  var googleUser = req.user;
  var userModel = res.locals.userModel;
  var choralId = req.params.choralId;
  
  var cookies = req.get("Cookie");
  var children = [];
  var child; 

  for(var i = 0; cookieHelper.readCookie('child' + i, cookies) != null; i++){
    child = cookieHelper.readCookie('child' + i, cookies);
    child = JSON.parse(child);
    children.push(child.choralId);
  } 
  
  var attrs = {
    user: userModel,
    sampleRate: req.body.sampleRate,
    type: 'choral',
    name: req.body.name,
    func: req.body.func,
    children: children
  };

  Choral.findOne({ choralId: choralId }, (err, choral) => {
    if (err) {
      console.log(err);
      res.flash('error', 'Choral does not exist');
      return res.send('404'); // notify client of failure
    }
    choral.edit(attrs, (err, choral) => {
      if(err){
        console.log(err);
        res.flash('error', 'Choral validation failed: ' + err);
        return next(err);
      }
      res.flash('success', 'Choral Edited');
      res.redirect(req.baseUrl + '/');
    });
  });
});
          
module.exports = router;
