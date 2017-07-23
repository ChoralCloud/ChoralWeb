function(children, done) {
  var children = Object.values(children)
  var sum = 0;
  for(var i = 0; i < children.length; i++) {
    var data = children[i].data;
    var dataValues = Object.values(data);
    for (var j = 0; j < dataValues.length; j++) {
      sum += dataValues[j];
    }
  }
  done({ 'Sum of child values': sum })
}
