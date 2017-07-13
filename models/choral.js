var mongoose = require('./setup'),
  ObjectId = mongoose.Schema.Types.ObjectId;

var uniqueValidator = require('mongoose-unique-validator');

var childSchema = new mongoose.Schema({
  id: { type: ObjectId, required: '{PATH} is required!' }
});

var choralSchema = new mongoose.Schema({
  children: [childSchema],
  userId: { type: ObjectId, required: '{PATH} is required!' }
});

// Create a new choral belonging to the user passed in the arguments
// user should be a user model
choralSchema.statics.createNew = function (user, cb) {
  console.log("CREATING CHORAL");
  var newChoral = new Choral();
  newChoral.userId = attrs.user.id;
  newChoral.save((err) => {
    if (err) {
      console.log(err)
      return;
    }
    console.log("CREATED CHORAL");
    cb();
  });
};

var Choral= mongoose.model('Choral', choralSchema);

module.exports = Choral;
