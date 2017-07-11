var mongoose = require('mongoose');

// set up the MongoDB connection
mongoose.connect('mongodb://localhost/choralweb');

module.exports = mongoose;
