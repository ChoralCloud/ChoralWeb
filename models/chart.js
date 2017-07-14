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

// Create a new chart belonging to attrs.user,
// viewing the value of attrs.choral
chartSchema.statics.createNew = function (attrs, cb) {
  var newChart = new Chart();
  newChart.userId = attrs.user.id;
  newChart.rootChoralId = attrs.choral.id

  newChart.save((err) => {
    if (err) {
      cb(err, null);
    }
    else {
      cb();
    }
  });
};

var Chart = mongoose.model('Chart', chartSchema);

module.exports = Chart;
