var mongoose = require('./setup');
var uniqueValidator = require('mongoose-unique-validator');

var userSchema = new mongoose.Schema({
  email: { type: String, required: '{PATH} is required!', unique: true },
  firstName: { type: String, required: '{PATH} is required!' },
  lastName: { type: String, required: '{PATH} is required!' }
});

// Find the user with the same email as passed in 'user', or
// create a new one if none exists
userSchema.statics.findOrCreateBefore = function (user, cb) {
  this.findOne({ email: user.emails[0] }, (err, userModel) => {
    if (err) {
      console.log(err);
      return;
    }
    if (userModel) {
      cb(userModel);
    }
    else {
      userModel = new User();
      userModel.email = user.emails[0];
      userModel.firstName = user.firstName;
      userModel.lastName = user.lastName;
      userModel.save((err) => {
        if (err) {
          console.log(err)
          return;
        }
        else {
          cb(userModel);
        }
      });
    }
  });
}

userSchema.plugin(uniqueValidator);
var User = mongoose.model('User', userSchema);

module.exports = User;
