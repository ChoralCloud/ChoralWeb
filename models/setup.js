var mongoose = require('mongoose');
const config = require('../config')

// set up the MongoDB connection
console.log("Starting Mongo: at " + config.mongo.url)
mongoose.connect(config.mongo.url, {
  useMongoClient:true
});


module.exports = mongoose;
