var mongoose = require('./setup');
var Schema = mongoose.Schema;

var choralSchema = new Schema({
    choral_id: String,
    children:[ String ],
    func: String,
    sample_rate: Number
});

var Choral = mongoose.model('Choral', choralSchema);

module.exports = Choral;
