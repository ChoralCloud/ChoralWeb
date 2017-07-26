//(

function (children, done){
  /*
   * This function converts the first child member that is a number
   * to the same value in canadian (use with caution)
   */

  function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }

  if(!children) return done({ price: 0 })

  var request = require('request')
  var options = {
    method: 'GET',
    uri: "http://api.fixer.io/latest?base=USD",
    json: true
  }

  request(options, function (err, res, body) {
    if (err) {
      console.log('error : ', err, body)
      return
    }

    if(body.rates){
      var childValues = Object.values(children)
      for(i in childValues){
        var child = childValues[i]
        if(!child.data) continue;

        var dataVals = Object.values(child.data)
        for(j in dataVals){
          var dataVal = dataVals[j]
          if(isNumber(dataVal)){
            return done({ price: (body.rates.CAD * Number(dataVal).toFixed(2)) })
          }
        }
      }
    }
    return done({ price: 0 })
  });
}

//)({ "child2":{ price:1.20 }, "child1":{ data:{price: 1.30} } }, (output) => console.log(output))


