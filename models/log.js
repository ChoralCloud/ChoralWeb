var mongoose = require('./setup');

var logSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now() },
  type: { type: String, required: '{PATH} is required!' },
  message: { type: String, required: '{PATH} is required!' },
  tags: { type: [String], required: '{PATH} is required!' }
});

logSchema.statics.findAll = function (cb) {
  this.find({}, function (err, logs) {
    if (err) return cb(err, null);
    cb(null, logs);
  });
};

logSchema.statics.createLog = function (entry) {
  var newEntry = new Log();
  if (entry.timestamp) newEntry.timestamp = entry.timestamp;
  if (entry.type)      newEntry.type = entry.type;
  if (entry.message)   newEntry.message = entry.message;
  if (entry.tags)      newEntry.tags = entry.tags;

  newEntry.save();
};

var Log = mongoose.model('Logs', logSchema);

module.exports = Log;
