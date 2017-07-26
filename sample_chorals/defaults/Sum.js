function(children, done) {
  /* Sample choral func.
   * Sum every first-level value of every child and return that
   * Nested values will break this
   * Returns the sum as the new value of this choral
   */
  var children = Object.values(children);
  var sum = 0;
  for (child in children) {
    var data = children[child].data;
    var dataValues = Object.values(data);
    for (value in dataValues) {
      sum += dataValues[value];
    }
  }
  done({ 'sum_of_children': sum })
}
