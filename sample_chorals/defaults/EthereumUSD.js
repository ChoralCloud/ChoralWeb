//(

function (_, done){
  /*
   * This function gets the latest value of ETH in USD
   * 
   */
  var request = require('request')
  var options = {
    method: 'GET',
    uri: "https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD",
    json: true
  }

  request(options, function (err, res, body) {
    if (err) {
      console.log('error : ', err, body)
      return
    }
    // reset the output on every request
    output = {
      price: null,
    }


    if(!res){
      return done(output)
    }

    output.price = body.USD
    done(output)
  });
}

//)({}, (output) => console.log(output))
