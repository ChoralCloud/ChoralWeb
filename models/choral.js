// TODO: validate that an added child choral is not already in the tree (prevent cycles)
var mongoose = require('./setup'),
  ObjectId = mongoose.Schema.Types.ObjectId;
var uniqueValidator = require('mongoose-unique-validator');
var srs = require('secure-random-string');

var choralSchema = new mongoose.Schema({
  children: {
    // this didnt work when it was a separate schema, I have no idea why and I dont
    // care to find out
    type: [{ type: ObjectId, required: '{PATH} is required!', ref: 'Choral'  }],
    validate: [
        {
          validator: function(children) { // ensure devices have no children
            return this.choralType == 'device' ? (children.length == 0) : true;
          },
          message: 'Device-type chorals are not allowed to have children!'
        },
        {
          isAsync: true,
          validator: function(v, cb) { // ensure devices have no children
            if(!v) return true;

            Choral.find({_id: {$in: v }}, (err, found) => {
              if(err){
                return cb(false, 'error from db while testing chorals: ' + err.message)
              }
              if(found.length != v.length){
                return cb(false, 'You have duplicate ids in the children or you are attempting to add a choral that no longer exists')
              }
              return cb(true, '')
            })
          },
        },

    ]  },
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
    default: "function(children, done){ done({ val: 1 }); }"
  },
  sampleRate: {
    type: Number,
    default: 5,
    min: 1,
    max: Math.floor((Math.pow(2, 31) -1)/1000),
  },
  choralType: {
    type: String,
    enum: ['choral', 'device'],
    required: '{PATH} is required!'
  },
  name: {
    type: String,
    required: '{PATH} is required!',
    default: 'My new choral'
  }
});

// Create a new choral belonging to attrs.user. attrs.user should be a user model
choralSchema.statics.createNew = function (attrs, cb) {
  var newChoral = new Choral();
  newChoral.choralId = srs({ length: 128 }); // if not unique, fails (should never happen)
  if (attrs.user.id)    newChoral.userId = attrs.user.id;
  if (attrs.func)       newChoral.func = attrs.func.trim();
  if (attrs.sampleRate) newChoral.sampleRate = attrs.sampleRate;
  if (attrs.name)       newChoral.name = attrs.name;
  if (attrs.type)       newChoral.choralType = attrs.type;
  if (attrs.children){
    newChoral.children = attrs.children
  }
  newChoral.save(cb);
};


choralSchema.methods.edit = function (attrs, cb) {
  var choral = this;
  if (attrs.user.id)    this.userId = attrs.user.id;
  if (attrs.func)       this.func = attrs.func.trim();
  if (attrs.sampleRate) this.sampleRate = attrs.sampleRate;
  if (attrs.name)       this.name = attrs.name;
  if (attrs.type)       this.choralType = attrs.type;
  if (attrs.children){
    this.children = attrs.children
  }
  this.save(cb);
};

choralSchema.statics.findAllForUser = function (user, cb) {
  this.find({ userId: user._id }, (err, chorals) => {
    if (err) return cb(err, null);
    cb(null, chorals);
  });
};

choralSchema.statics.findDevicesForUser = function (user, cb) {
  this.find({ $and: [ { userId: user._id }, { choralType: "device" } ] }, (err, devices) => {
    if (err) return cb(err, null);
    cb(null, devices);
  });
};

choralSchema.statics.findTreeForUser = function (user, cb) {
  this.find({ userId: user._id }, (err, chorals) => {
    if (err) return cb(err, null);

    var all = {};
    var children = [];
    for (var i in chorals) {
      children = children.concat(chorals[i].children);
      all[chorals[i]._id] = chorals[i];
    }
    // Find all roots
    this.find({ $and: [ { userId: user._id }, 
                        { _id: { $nin: children } } ] }, (err, rootChorals) => {
      if (err) return cb(err, null);

      var nodes = {};
      var edges = {};
      var choralIdNode = {};
      var choralIdEdge = {};

      // Construct nodes and edges for all chorals
      for (var i in chorals) {
        var node = {
          id: chorals[i].choralId,
          label: chorals[i].name,
          shape: chorals[i].choralType == 'choral' ? 'circle' : 'square'
        }

        var e = [];

        nodes[chorals[i].choralId] = node;

        var edge = {};
        if (chorals[i].children.length > 0) {
          for (var j in chorals[i].children) {
            edge.from = chorals[i].choralId;
            var choral = all[chorals[i].children[j].toString()];
            if (choral) {
              edge.to = choral.choralId;
              e.push(edge);
              edge = {};
            }
          }
        }

        edges[chorals[i].choralId] = e;
      }

      // Construct root nodes and edges
      for (i in rootChorals) {
        var node = {
          id: rootChorals[i].choralId,
          label: rootChorals[i].name,
          shape: rootChorals[i].choralType == 'choral' ? 'circle' : 'square'
        }
        var n = [node];
        var e = [];

        var stack = [];
        stack.push(rootChorals[i].choralId);

        while(stack.length > 0) {
          var v = stack.pop();
          var adjacent = edges[v];
          for (var j in adjacent) {
            if (adjacent[j].from == v) {
              stack.push(adjacent[j].to);
              e.push(adjacent[j]);
              n.push(nodes[adjacent[j].to]);
            }
          }
        }

        choralIdNode[rootChorals[i].choralId] = n;
        choralIdEdge[rootChorals[i].choralId] = e;
      }

      var tree = {
        chorals: chorals,
        rootChorals: rootChorals,
        nodes: choralIdNode,
        edges: choralIdEdge
      };

      cb(null, tree);
    });
  });
}

choralSchema.statics.findRootChoralsForUser = function (user, cb) {
  this.find({ $and: [ { userId: user._id }, { choralType: "choral" }, { $where: "this.children.length > 0" } ] }, (err, chorals) => {
    if (err) return cb(err, null);

    // found all chorals with children
    var children = []
    for (i in chorals) {
      children = children.concat(chorals[i].children)
    }
    // do another find query
    this.find({ $and: [ { userId: user._id }, 
                        { choralType: "choral" }, 
                        { _id: { $nin: children } } ] }, (err, rootChorals) => {
      if (err) return cb(err, null);
      cb(null, rootChorals);
    });
  });
}

// get all chorals that require processing and return the result as a list
choralSchema.statics.getAllChorals = function (cb) {
  Choral.find({ choralType: "choral" })
    // this follows the object ids in the children array and
    // populates them with the choral info
    .populate("children", "choralId name")
    .exec(cb);
};

var Choral= mongoose.model('Choral', choralSchema);

module.exports = Choral;
