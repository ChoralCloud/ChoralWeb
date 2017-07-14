var mongoose = require('./setup'),
  ObjectId = mongoose.Schema.Types.ObjectId;
var uniqueValidator = require('mongoose-unique-validator');
var srs = require('secure-random-string');

var childSchema = new mongoose.Schema({
  id: { type: ObjectId, required: '{PATH} is required!' }
});

var choralSchema = new mongoose.Schema({
  children: [childSchema],
  userId: { type: ObjectId, required: '{PATH} is required!' },
  choralId: { // refers to choral_id in cassandra
    type: String,
    required: '{PATH} is required!',
    unique: true,
    minLength: 128
  },
  func: {
    type: String,
    required: [
      function() { return this.type == 'choral' },
      '{PATH} is required for non-device chorals!'
    ],
    default: "function(data) { return data[0] || 1; }"
  },
  sampleRate: {
    type: Number,
    default: 5,
    min: 1,
  },
  choralType: {
    type: String,
    enum: ['choral', 'device'],
    required: '{PATH} is required!'
  }
});

// Create a new choral belonging to attrs.user. attrs.user should be a user model
choralSchema.statics.createNew = function (attrs, cb) {
  var newChoral = new Choral();
  newChoral.userId = attrs.user.id;
  newChoral.func = attrs.func;
  newChoral.sampleRate = attrs.sampleRate;
  // if this is not unique, the save will simply fail right now
  newChoral.choralId = srs({ length: 128 });
  newChoral.choralType = 'choral';
  newChoral.save((err) => {
    if (err) {
      console.log(err)
      return;
    }
    cb();
  });
};

var Choral= mongoose.model('Choral', choralSchema);

module.exports = Choral;
