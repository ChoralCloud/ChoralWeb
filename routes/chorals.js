var express = require('express');
var router = express.Router();
var Choral = require('../models/choral');
var viewHelpers = require('../helpers/viewHelpers');
var logHelper = require('../helpers/logHelper');
var client = require('redis').createClient(process.env.REDIS_STORE_URI)
const cassandra = require('cassandra-driver');
const cass_client = new cassandra.Client({
  contactPoints: [process.env.CASSANDRA_URL],
  keyspace: 'choraldatastream'
});
var fs = require('fs');

const DEFAULT_FUNCS_DIR = 'sample_chorals/defaults';

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

function getChildrenFromRequest(req){
  var reqChildren = req.body['children[]'];
  // if the value is a string then convert it to an array
  // for some reason when only one thing comes in it comes in as a
  // string instead of an array
  if (typeof reqChildren === 'string' || reqChildren instanceof String){
      reqChildren = [ reqChildren ];
  }
  var children = [];
  if(reqChildren && reqChildren.length){
      children = reqChildren.map((val) => {return { _id: val } } );
  }
  return children;
}

router.post('/', function(req, res, next) {
  var googleUser = req.user;
  var userModel = res.locals.userModel;

  var children = getChildrenFromRequest(req)

  var attrs = {
    user: userModel,
    sampleRate: req.body.sampleRate,
    type: 'choral',
    name: req.body.name,
    // if both default and custom func submitted, use custom
    func: req.body.func || req.body.defaultFunc,
    children: children
  };

  Choral.createNew(attrs, (err, choral) => {
    if(err){
      console.log(err);

      logHelper.createLog(
        "error",
        'Choral validation failed: ' + err,
        ["chorals", "createNew"]
      );

      res.flash('error', 'Choral validation failed: ' + err);
      return res.redirect(req.baseUrl + '/new');
    }

    logHelper.createLog(
      "success",
      'New choral created: ' + JSON.stringify(attrs),
      ["chorals", "createNew"]
    );

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

    getDefaultFuncs() // fetch quick funcs
      .then(funcs => {

        // prepend empty quick func func, so that default is no quick func
        funcs.unshift({ fileName: 'None', func: '' });

        res.render('newChoral', {
          googleUser: googleUser,
          userModel: userModel,
          viewHelpers: viewHelpers,
          chorals: chorals,
          defaultFuncs: funcs
        });
      })
      .catch(err => {
        console.log(err)
        next(err);
      });
  });
});

// get the choral page
router.get('/:choralId', function(req, res, next) {
  var choralId = req.params.choralId;
  var userModel = res.locals.userModel;
  var timeFrame;

  if(req.query.timeFrame){
    timeFrame = req.query.timeFrame;
  } else {
    timeFrame = '600';
  }

  //get parent Choral
  let p1 = new Promise((resolve, reject) => {
    Choral.findOne({ choralId: choralId }, (err, choral) => {
      if (err || !choral) {
        logHelper.createLog("error", 'Choral does not exist: ' + err, ["chorals", "get"]);
        console.log(err);
        res.flash('error', 'Choral does not exist');
        return res.send('404'); // notify client of failure
      }
      resolve(choral);
    });
  });

  // this promise chain does children stuff:
  // 1. gets children of the parent choral from mongo
  // 2. gets child data from redis
  let p2 = p1.then((choral) => {
    // get all choralId's of children
    if(choral.children == null) return Promise.resolve({});
    return Promise.all(choral.children.map((childId) => {
      return new Promise((resolve, reject) => {
        Choral.findOne({_id: childId}, (err, child) => {
          if(err) {
            console.log(err);
            return res.send('404 Chorals child does not exist');
          }
          resolve(child);
        });
      });
    })).then((values) => {
      // we only arrive here if there were children
      // aggregate the values and return only 1 object
      childData = {}
      for(var i = 0; i < values.length; i++) {
        childData[values[i].choralId] = {
          name: values[i].name,
          choralId: values[i].choralId
        }
      }
      return Promise.resolve(childData);
    });
  }).then((childData) => {
    // now we have children, if it's not empty, go get the redis data
    return Promise.all(Object.keys(childData).map((choralId) => {
      return new Promise((resolve, reject) => {
        client.hgetall(choralId, (err, data) => {
          if(err) {
            logHelper.createLog(
              "error",
              'Choral data has not yet been published to redis: ' + err
              , ["chorals", "get"]
            );
            reject(err);
          }
          if(data == null) {
            reject("data is null");
          } else {
            data.choralId = choralId;
            resolve(data);
          }
        });
      });
    })).then((values) => {
      // again aggregate the values into childData object
      for(var i = 0; i < values.length; i++) {
        childData[values[i].choralId].device_data = values[i].device_data;
      }
      return Promise.resolve(childData);
    });
  }).catch((reason) => {
    res.send(String(reason));
  });
  // this promise has now returned an object of child data.


  // do parent stuff
  let p3 = p1.then((choral) => {
    parentObj = {
      choralInfo: {
        sampleRate: choral.sampleRate,
        name: choral.name,
        choralId: choral.choralId
      }
    };
    return new Promise((resolve,reject) => {
      // get parent data from redis, so we can use that to form tabs
      client.hgetall(choral.choralId, (err, data) => {
        if(err) {
          logHelper.createLog("error", 'Choral data has not yet been published to redis: ' + err, ["chorals", "get"]);
          reject("404 - Choral data not found in redis");
        }
        var tabs = [];
        if(data == null) {
          reject("No data found in redis for this choral");
        } else {
          var parsedData = JSON.parse(data.device_data);
          for( key in parsedData ) {
            var val = parsedData[key];
            if( !isNaN(parseFloat(val)) && isFinite(val) ) {
              tabs.push(key);
            }
          }
        }
        parentObj.tabs = tabs;
        resolve(parentObj);
      });
    });
  }).then((parentObj) => {
    // get parent past data in cassandra, and add to parent object
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM choraldatastream.raw_data WHERE device_id = ? order by device_timestamp DESC limit ?';
      cass_client.execute( query , [ choralId,  1 + (timeFrame/parentObj.choralInfo.sampleRate)], { prepare: true }, function( err, result ) {
        if(err || !result) {
          logHelper.createLog("error", 'Choral data was not found in cassandra: ' + err, ["chorals", "get"]);
          console.log(err);
          res.send("Choral not found in database");
        }
        var sorted_results = {};
        var rows = result.rows.reverse();
        for( var i = 0; i < parentObj.tabs.length; i++ ) {
          sorted_results[parentObj.tabs[i]] = [];
        }

        for( var i = 0; i < rows.length; i++ ) {
          date = rows[i].device_timestamp;
          date = Date.parse(date);
          for( var j = 0; j < parentObj.tabs.length; j++ ) {
            data = JSON.parse(rows[i].device_data)
            sorted_results[parentObj.tabs[j]].push({
              time: date/1000,
              y: data[parentObj.tabs[j]]
            });
          }
        }
        parentObj.pastData = sorted_results;
        resolve(parentObj);
      });
    });
  }).catch((reason) => {
    res.send(String(reason));
  });
  // this promise has now return an object containing the parent data
  // this is the content we are going to display on the graph


  Promise.all([p2,p3]).then((values) => {
    // once both chains have finished, we can render the page
    var childData = values[0];
    var parentData = values[1];
    res.render('choral', {
      googleUser: req.user,
      parentChoralId: req.params.choralId,
      tabs: parentData.tabs,
      pastData: parentData.pastData,
      choralInfo: parentData.choralInfo,
      childData: childData,
      timeFrame: timeFrame
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
      return res.send('204');  // successful deletion
    });
  });
});

router.get('/edit/:choralId', function(req, res, next) {
  var googleUser = req.user;
  var userModel = res.locals.userModel;
  var choralId = req.params.choralId;

  Choral.findOne({
    userId: userModel,
    choralType: "choral",
    choralId: choralId
    })
    // this follows the object ids in the children array and
    // populates them with the choral info
    .populate("children")
    .exec((err, choral) => {
      if (err || !choral) {
        console.log(err);
        res.flash('error', 'Choral does not exist');
        return res.redirect('/chorals')
      }
      //Pass choral to be edited and list of chorals
      Choral.findAllForUser(userModel, (err, chorals) => {
        if (err) {
          console.log(err);
          res.flash('error', err.message);
          return res.redirect('/chorals')
        }

        res.render('editChoral', {
          googleUser: googleUser,
          userModel: userModel,
          chorals: chorals || [],
          choralEdit: choral,
          children: choral.children
        });
      })
    });
});

router.post('/edit/:choralId', function(req, res, next) {
  var googleUser = req.user;
  var userModel = res.locals.userModel;
  var choralId = req.params.choralId;

  var children = getChildrenFromRequest(req)

  var attrs = {
    user: userModel,
    sampleRate: req.body.sampleRate,
    type: 'choral',
    name: req.body.name,
    func: req.body.func,
    children: children
  };

  Choral.findOne({ choralId: choralId }, (err, choral) => {
    if (err || !choral) {
      console.log(err);
      res.flash('error', 'Choral does not exist');
      return res.send('404'); // notify client of failure
    }
    choral.edit(attrs, (err) => {
      if(err){
        console.log(err);
        res.flash('error', 'Choral validation failed: ' + err);
        return res.redirect(req.originalUrl + '/');
      }
      res.flash('success', 'Choral Edited');
      res.redirect(req.baseUrl + '/');
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
