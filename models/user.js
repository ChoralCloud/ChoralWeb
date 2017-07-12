var mongoose = require('./setup');

var userSchema = new mongoose.Schema({
  email: { type: String, required: '{PATH} is required!' },
  firstName: { type: String, required: '{PATH} is required!' },
  lastName: { type: String, required: '{PATH} is required!' }
});

userSchema.statics.findOrCreateBefore = function (user, cb) {
  this.findOne({ email: user.emails[0] }, (err, user) => {
    if (err) {
      console.log(err);
    }
    else {
      if (!user) {
        user = new User();
        user.email = user.emails[0];
        user.firstName = user.firstName;
        user.lastName = user.lastName;
        user.save((err) => {
          if (err) {
            console.log(err)
          }
          else {
            cb(user);
          }
        });
      }
      else {
        cb(user);
      }
    }
  });
}

var User = mongoose.model('User', userSchema);

module.exports = User;
