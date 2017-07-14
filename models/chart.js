var mongoose = require('./setup'),
  ObjectId = mongoose.Schema.Types.ObjectId;

var chartSchema = new mongoose.Schema({
  userId: { type: ObjectId, required: '{PATH} is required!' },
  rootChoralId: { // refers to choral_id in cassandra
    type: String,
    required: '{PATH} is required!',
    unique: true,
    minLength: 128
  }
});

var Chart = mongoose.model('Chart', chartSchema);

module.exports = Chart;
