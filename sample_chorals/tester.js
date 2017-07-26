var fs = require('fs');
var path = require('path');
var {runComputation} = require('../worker/updateChorals.js');


var p = path.join(__dirname, 'sample_chorals', 'victoria.js');

fs.readFile(p, 'utf8', function (err,data) {
  if(err) return console.log(err.message)
  runComputation({}, "")
});
