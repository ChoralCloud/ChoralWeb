// TODO: validate that an added child choral is not already in the tree (prevent cycles)
var mongoose = require('./setup'),
  ObjectId = mongoose.Schema.Types.ObjectId;
var uniqueValidator = require('mongoose-unique-validator');
var srs = require('secure-random-string');

var childSchema = new mongoose.Schema({
  childId: { type: ObjectId, required: '{PATH} is required!' }
});

var choralSchema = new mongoose.Schema({
  children: {
    type: [childSchema],
    validate: {
      validator: function(children) { // ensure devices have no children
        return this.choralType == 'device' ? (children.length == 0) : true;
      },
      message: 'Device-type chorals are not allowed to have children!'
    }
  },
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
  },
  name: String
});

// Create a new choral belonging to attrs.user. attrs.user should be a user model
choralSchema.statics.createNew = function (attrs, cb) {
  var newChoral = new Choral();
  newChoral.userId = attrs.user.id;
  newChoral.func = attrs.func;
  newChoral.sampleRate = attrs.sampleRate;
  newChoral.choralId = srs({ length: 128 }); // if not unique, fails (should never happen)
  newChoral.choralType = attrs.type;
  newChoral.name = attrs.name;
  newChoral.save((err) => {
    if (err) {
      cb(err, null);
    }
    else {
      cb(null, newChoral);
      console.log('Device was created successfully');
    }
  });
  return newChoral;
};

choralSchema.statics.findAllForUser = function (user, cb) {
  this.find({ userId: user._id }, (err, chorals) => {
    if (err) return cb(err, null);
    cb(null, chorals);
  });
};

choralSchema.methods.addChild = function (child, cb) {
  this.children.push({ childId: child._id });
  this.save((err) => {
    if (err) {
      cb(err);
    }
    else {
      cb(null);
    }
  });
};

var Choral= mongoose.model('Choral', choralSchema);

module.exports = Choral;
