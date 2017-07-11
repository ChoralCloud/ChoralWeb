var mongoose = require('./setup');

var Schema = mongoose.Schema,
    ObjectId = Schema.ObjectId;

var userSchema = new Schema({
  email: { type: String, required: '{PATH} is required!' },
});

var User = mongoose.model('User', userSchema);
module.exports = User;
