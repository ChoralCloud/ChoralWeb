function(children, done) {
  // Sum every value of every child and return that
  // value as the new value of this choral
  var children = Object.values(children)
  var sum = 0;
  for(var i = 0; i < children.length; i++) {
    var data = children[i].data;
    var dataValues = Object.values(data);
    for (var j = 0; j < dataValues.length; j++) {
      sum += dataValues[j];
    }
  }
  done({ 'sum_of_children': sum })
}
