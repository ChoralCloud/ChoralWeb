//(

function(children, done) {
  /* Sample choral func.
   * Sum every first-level value of every child and return that
   * Nested values will break this
   * Returns the sum as the new value of this choral
   */
  var children = Object.values(children);
  var prod = 1;
  for (child in children) {
    var data = children[child].data;
    var dataValues = Object.values(data);
    for (value in dataValues) {
      prod *= dataValues[value];
    }
  }
  done({ 'totalvalue': Number(prod.toFixed(2)) })
}

//)({ "child2":{  data:{price: 1.30} }, "child1":{ data:{price: 1.30} } }, (output) => console.log(output))
