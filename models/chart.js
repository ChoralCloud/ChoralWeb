var mongoose = require('./setup'),
  ObjectId = mongoose.Schema.Types.ObjectId;

var chartSchema = new mongoose.Schema({
  userId: {
    type: ObjectId,
    required: '{PATH} is required!'
  },
  rootChoralId: { // refers to the root choral whose value the chart will display
    type: ObjectId,
    required: '{PATH} is required!',
  }
});

var Chart = mongoose.model('Chart', chartSchema);

module.exports = Chart;
