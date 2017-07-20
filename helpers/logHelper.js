var Log = require('../models/log');

function createLog(type, message, tags) {
  var entry = {
    "type": type,
    "message": message,
    "tags": tags
  };
  Log.createLog(entry);
  return;
}

module.exports = {
  createLog: createLog
}
